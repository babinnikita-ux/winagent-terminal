const mode = process.argv[2] || 'success';

if (mode === 'success') {
  process.stdout.write('{"type":"result","summary":"ok"}\n');
  process.exit(0);
}
if (mode === 'auth') {
  process.stderr.write('AUTH_REQUIRED: sign in required\n');
  process.exit(1);
}
if (mode === 'quota') {
  process.stderr.write('SUBSCRIPTION_LIMIT: try again later\n');
  process.exit(1);
}
if (mode === 'malformed') {
  process.stdout.write('{not-json}\n');
  process.exit(0);
}
if (mode === 'large-stderr') {
  process.stderr.write(`Authorization: Bearer should-not-leak\n${'x'.repeat(4096)}`);
  process.exit(1);
}
if (mode === 'hang') {
  setInterval(() => process.stdout.write('working\n'), 20);
} else if (mode === 'crash') {
  process.stderr.write('simulated crash\n');
  process.exit(2);
} else {
  process.stderr.write(`unknown mode: ${mode}\n`);
  process.exit(3);
}
