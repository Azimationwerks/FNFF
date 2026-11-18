<?php
/* =====================================================================
   First Nation Fresh Foods — form delivery endpoint
   ---------------------------------------------------------------------
   Receives the contact enquiry and the quote specification from the
   website and sends them as email FROM THE SERVER. Nothing opens the
   visitor's mail program.

   WHERE TO HOST THIS
   Any Linux / cPanel hosting that runs PHP, which includes GoDaddy's
   Linux Web Hosting and Managed WordPress plans. Upload this file to
   the same folder as index.html. Nothing else to install.

   SET UP — three steps
   1.  In cPanel, create the mailboxes on the domain:
         orders@firstnationfreshfoods.com.au
         sales@firstnationfreshfoods.com.au
         noreply@firstnationfreshfoods.com.au      <- the sending account
   2.  Fill in SMTP_USER and SMTP_PASS below with the noreply mailbox
       and its password.
   3.  Add an SPF record to the domain's DNS so mail is not treated as
       spam:   v=spf1 include:secureserver.net ~all
       (GoDaddy adds this automatically when email is set up on the
       domain — check it exists rather than adding a second one.)

   WHY SMTP AND NOT PHP mail()
   mail() sends through the server's local queue with no authentication.
   Gmail, Outlook and most corporate filters now treat that as suspicious
   and quietly bin it, so enquiries disappear without anyone knowing.
   Sending authenticated through the domain's own mailbox is what makes
   the message arrive. If SMTP is left unconfigured this script falls
   back to mail(), so the site still works, but configure SMTP before
   go-live.
   ===================================================================== */

declare(strict_types=1);

// ---------------------------------------------------------------- config
const SMTP_HOST   = 'smtpout.secureserver.net';   // GoDaddy outgoing server
const SMTP_PORT   = 587;                          // 587 STARTTLS, or 465 SSL
const SMTP_SECURE = 'tls';                        // 'tls' | 'ssl' | ''
const SMTP_USER   = '';                           // noreply@firstnationfreshfoods.com.au
const SMTP_PASS   = '';                           // its mailbox password

const FROM_EMAIL  = 'noreply@firstnationfreshfoods.com.au';
const FROM_NAME   = 'First Nation Fresh Foods Website';

// Only these addresses may be sent to. The recipient arrives from the
// browser, so it is checked against this list rather than trusted.
const ALLOWED_TO = [
    'orders@firstnationfreshfoods.com.au',
    'sales@firstnationfreshfoods.com.au',
    'admin@firstnationfreshfoods.com.au',
];
const DEFAULT_TO = 'sales@firstnationfreshfoods.com.au';

const COPY_TO_FILE = __DIR__ . '/enquiries.log';   // '' to switch off
const RATE_SECONDS = 20;                            // min gap between sends per visitor

// ---------------------------------------------------------------- helpers
function out(array $d, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($d);
    exit;
}

function clean(string $s, int $max = 2000): string {
    $s = str_replace(["\r", "\n", "\0"], ' ', $s);      // header-injection guard
    return trim(mb_substr($s, 0, $max));
}

function body_clean(string $s, int $max = 20000): string {
    $s = str_replace("\0", '', $s);
    return trim(mb_substr($s, 0, $max));
}

header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(['ok' => false, 'error' => 'Method not allowed'], 405);
}

// -------------------------------------------------- simple rate limiting
session_start();
$now  = time();
$last = $_SESSION['fnff_last_send'] ?? 0;
if ($now - $last < RATE_SECONDS) {
    out(['ok' => false, 'error' => 'Please wait a moment before sending again.'], 429);
}

// ---------------------------------------------------------------- input
$raw = file_get_contents('php://input') ?: '';
$in  = json_decode($raw, true);
if (!is_array($in)) { $in = $_POST; }
if (!is_array($in) || !$in) {
    out(['ok' => false, 'error' => 'Nothing was received.'], 400);
}

// honeypot — bots fill every field they find
if (!empty($in['website'] ?? '')) { out(['ok' => true]); }

$name  = clean((string)($in['name']  ?? ''), 160);
$email = clean((string)($in['email'] ?? ''), 160);
$phone = clean((string)($in['phone'] ?? ''), 60);
$org   = clean((string)($in['org']   ?? ''), 200);
$subj  = clean((string)($in['subject'] ?? 'Website enquiry'), 200);
$text  = body_clean((string)($in['text'] ?? ''));
$form  = clean((string)($in['form'] ?? 'enquiry'), 40);

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    out(['ok' => false, 'error' => 'Please enter a valid email address.'], 400);
}
if ($text === '' && empty($in['items'])) {
    out(['ok' => false, 'error' => 'The message was empty.'], 400);
}

$to = clean((string)($in['to'] ?? ''), 160);
if (!in_array($to, ALLOWED_TO, true)) { $to = DEFAULT_TO; }

// ---------------------------------------------------------------- message
$lines = [
    'FIRST NATION FRESH FOODS — WEBSITE ' . strtoupper($form),
    str_repeat('=', 54),
    '',
    'Received:     ' . date('D j M Y, g:ia'),
    'Organisation: ' . ($org ?: '—'),
    'Contact:      ' . ($name ?: '—'),
    'Email:        ' . $email,
    'Phone:        ' . ($phone ?: '—'),
    '',
    str_repeat('-', 54),
    '',
    $text,
    '',
    str_repeat('-', 54),
    'Sent from firstnationfreshfoods.com.au',
];
$body = implode("\n", $lines);

// ---------------------------------------------------------------- send
$ok = false; $err = '';
if (SMTP_USER !== '' && SMTP_PASS !== '') {
    [$ok, $err] = smtp_send($to, $subj, $body, $email, $name);
} else {
    $headers = "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n"
             . "Reply-To: " . ($name !== '' ? "$name <$email>" : $email) . "\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n"
             . "MIME-Version: 1.0\r\n";
    $ok  = @mail($to, $subj, $body, $headers);
    $err = $ok ? '' : 'The server could not send the message.';
}

if (COPY_TO_FILE !== '') {
    @file_put_contents(
        COPY_TO_FILE,
        "\n==== " . date('c') . ' — to ' . $to . ' — ' . ($ok ? 'SENT' : 'FAILED: ' . $err) . " ====\n" . $body . "\n",
        FILE_APPEND | LOCK_EX
    );
}

if ($ok) {
    $_SESSION['fnff_last_send'] = $now;
    out(['ok' => true]);
}
out(['ok' => false, 'error' => $err ?: 'The message could not be sent. Please call us instead.'], 500);


/* ============================================================
   Minimal authenticated SMTP client — no library to install
   ============================================================ */
function smtp_send(string $to, string $subject, string $body, string $replyEmail, string $replyName): array
{
    $host = (SMTP_SECURE === 'ssl' ? 'ssl://' : '') . SMTP_HOST;
    $fp = @stream_socket_client("$host:" . SMTP_PORT, $errno, $errstr, 20);
    if (!$fp) { return [false, "Could not reach the mail server ($errstr)"]; }
    stream_set_timeout($fp, 20);

    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $data;
    };
    $cmd = function (string $c, string $expect) use ($fp, $read): array {
        fwrite($fp, $c . "\r\n");
        $r = $read();
        return [str_starts_with($r, $expect), trim($r)];
    };

    $greet = $read();
    if (!str_starts_with($greet, '220')) { fclose($fp); return [false, 'Mail server refused the connection']; }

    $domain = $_SERVER['SERVER_NAME'] ?? 'firstnationfreshfoods.com.au';
    [$ok] = $cmd("EHLO $domain", '250');
    if (!$ok) { fclose($fp); return [false, 'EHLO refused']; }

    if (SMTP_SECURE === 'tls') {
        [$ok] = $cmd('STARTTLS', '220');
        if (!$ok) { fclose($fp); return [false, 'STARTTLS refused']; }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp); return [false, 'Could not start TLS'];
        }
        $cmd("EHLO $domain", '250');
    }

    [$ok] = $cmd('AUTH LOGIN', '334');
    if (!$ok) { fclose($fp); return [false, 'Mail server did not offer AUTH LOGIN']; }
    [$ok] = $cmd(base64_encode(SMTP_USER), '334');
    if (!$ok) { fclose($fp); return [false, 'Mailbox username rejected']; }
    [$ok, $msg] = $cmd(base64_encode(SMTP_PASS), '235');
    if (!$ok) { fclose($fp); return [false, 'Mailbox sign-in failed — check SMTP_USER and SMTP_PASS. ' . $msg]; }

    [$ok] = $cmd('MAIL FROM:<' . FROM_EMAIL . '>', '250');
    if (!$ok) { fclose($fp); return [false, 'Sender address rejected']; }
    [$ok] = $cmd('RCPT TO:<' . $to . '>', '250');
    if (!$ok) { fclose($fp); return [false, 'Recipient address rejected']; }
    [$ok] = $cmd('DATA', '354');
    if (!$ok) { fclose($fp); return [false, 'Server would not accept the message']; }

    $reply = $replyName !== '' ? "$replyName <$replyEmail>" : $replyEmail;
    $head = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . ">\r\n"
          . 'To: <' . $to . ">\r\n"
          . 'Reply-To: ' . $reply . "\r\n"
          . 'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n"
          . "MIME-Version: 1.0\r\n"
          . "Content-Type: text/plain; charset=UTF-8\r\n"
          . "Content-Transfer-Encoding: 8bit\r\n"
          . 'Date: ' . date('r') . "\r\n\r\n";

    // a lone dot on its own line would end the message early
    $safe = preg_replace('/^\./m', '..', $body);
    fwrite($fp, $head . $safe . "\r\n.\r\n");
    $r = $read();
    $cmd('QUIT', '221');
    fclose($fp);

    return str_starts_with($r, '250')
        ? [true, '']
        : [false, 'The mail server rejected the message: ' . trim($r)];
}
