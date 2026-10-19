/**
 * GreenO data is created and maintained by the authenticated admin console.
 * This seed intentionally creates no demo products, accounts, orders, or secrets.
 */
async function main() {
  process.stdout.write("No demo data is seeded. Store records are managed in the admin console.\n");
}

main().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : "Seed command failed.") + "\n");
  process.exitCode = 1;
});