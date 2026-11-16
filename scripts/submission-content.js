const people = {
  mubeen: {
    name: 'Muhammad Mubeen',
    id: '23F-3055',
    title: 'Module 1 — Shop Registration & Approval',
    files: 'server/routes/shops.js, register-shop.html, js/module-register-shop.js, admin-shops.html, browse-shops.html, js/module-browse-shops.js',
    endpoints: 'POST /api/shops/register, GET /api/shops/public, GET /api/shops/mine, GET /api/admin/shops, PATCH /api/admin/shops/:id/status',
    tables: 'users, shops, audit_log',
    demo: [
      'Open register-shop.html and submit a new owner and shop.',
      'Observe the Pending application status.',
      'Try signing in as the pending owner and show the 403 response.',
      'Sign in as Sara Khan and open admin-shops.html.',
      'Approve the pending shop and inspect the queue.',
      'Open browse-shops.html and find the now active shop.',
      'Sign in as the new owner and open the owner dashboard.'
    ],
    walkthrough: 'The registration form sends the submitted fields to POST /api/shops/register. The route validates each field and rejects extra fields. bcrypt hashes the password at cost 12. An immediate SQLite transaction inserts a Pending user and Pending shop, appends a chained audit record, and returns the new shop ID and status. The admin route verifies a JWT and the admin role, updates both user and shop status in one transaction, then records the decision. The public directory reads only Active shops and omits private owner details.',
    security: 'Server-side validation, bound SQL parameters, bcrypt password hashing, registration rate limit, JWT verification, admin role checks, atomic transactions, generic duplicate errors, masked owner phone, audit hash chain, Active-only directory, DOM text rendering.',
    viva: [
      ['Why are new shops Pending?', 'A platform admin must approve them before they appear publicly or can sign in.'],
      ['Why insert user and shop in one transaction?', 'A failure cannot leave an owner without a matching shop or the reverse.'],
      ['Where is the password stored?', 'Only its bcrypt hash is stored in users.password_hash.'],
      ['How are duplicates prevented?', 'Database unique constraints and bound lookups reject duplicate email or shop name and city.'],
      ['Can an owner approve a shop?', 'No. The API requires the admin role and audits denied attempts.'],
      ['How is public privacy enforced?', 'The public query selects Active shops and returns a restricted set of fields.'],
      ['Why use prepared statements?', 'Bound parameters keep submitted values out of SQL syntax.'],
      ['What does the audit chain record?', 'Each event links to the previous SHA-256 hash, making later modification detectable.']
    ]
  },
  ahmad: {
    name: 'Ahmad Abdullah',
    id: '23F-3027',
    title: 'Module 2 — Digital Khata',
    files: 'server/routes/khata.js, app-khata.html, js/module-khata.js, Khata summary in app-dashboard.html',
    endpoints: 'GET /api/khata/customers, POST /api/khata/customers, GET /api/khata/customers/:id/entries, POST /api/khata/entries, GET /api/khata/customers/:id/phone',
    tables: 'users, shops, customers, khata_entries, audit_log. SQLite BEFORE UPDATE and BEFORE DELETE triggers make khata_entries and audit_log append-only.',
    demo: [
      'Sign in as Hamza Ali and open app-khata.html.',
      'Show the customer list and computed balances loaded from the API.',
      'Create a customer if needed, then add a credit entry.',
      'Reload and show the stored entry and updated balance.',
      'Record a payment and show the reduced balance.',
      'Reveal a customer phone for ten seconds and show that the reveal was audited.',
      'Sign in as Bilal Ahmed and show that Hamza’s customer ID returns 404.',
      'Sign in as Sara Khan and show that Khata returns 403.'
    ],
    walkthrough: 'The page loads customers from GET /api/khata/customers. The JWT middleware reloads the active user and identifies the owner’s shop. Every Khata query binds that shop ID from the verified account, so a request cannot choose another shop. Creating an entry validates the type, integer amount, note, and customer ownership. A SQLite transaction inserts an append-only entry and audit row, computes the new balance with SUM, and returns it. Reloading the ledger reads the saved rows and computes running balances. The phone endpoint logs PHONE_UNMASKED before returning the full number.',
    security: 'JWT and owner role on every endpoint, shop ID from the verified account, 404 for another shop’s customer, bound SQL parameters, integer amount bounds, append-only triggers, transactional audit records, masked phone and audited ten-second reveal, DOM text rendering.',
    viva: [
      ['How is tenant isolation enforced?', 'Every customer and entry query binds the shop ID loaded from the authenticated owner.'],
      ['What happens when an owner requests another shop’s customer?', 'The API returns 404 without revealing whether that customer exists elsewhere.'],
      ['How is a balance stored?', 'It is computed from the sum of credit amounts minus payment amounts.'],
      ['Why are entries append-only?', 'Historical credit and payment records remain intact for accountability.'],
      ['What stops direct SQL edits?', 'SQLite BEFORE UPDATE and BEFORE DELETE triggers abort the change.'],
      ['Why use a transaction for entry creation?', 'The entry and audit row commit together.'],
      ['Can an admin view Khata?', 'No. The API requires the owner role and returns 403 to an admin.'],
      ['How is a full phone number protected?', 'The list masks it. A separate owner-only reveal endpoint logs the access.']
    ]
  }
};

function memberModule(key) {
  const person = people[key];
  if (!person) throw new Error('Unknown submission member');
  return `# ${person.title}\n\n${person.name} (${person.id})\n\n## Files\n\n${person.files}\n\n## Endpoints\n\n${person.endpoints}\n\n## Database\n\n${person.tables}\n\n## Demonstration\n\n${person.demo.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## Code walkthrough\n\n${person.walkthrough}\n\n## Security controls\n\n${person.security}\n\n## Viva questions\n\n${person.viva.map(([question, answer], index) => `${index + 1}. **${question}** ${answer}`).join('\n\n')}\n`;
}

const index = `# Activity 6 Submission Index\n\nProject — Dukaan Saathi\n\nGroup — Ahmad Abdullah (23F-3027) and Muhammad Mubeen (23F-3055)\n\nInstructor — Awais Azam\n\n| Submission requirement | Location |\n| --- | --- |\n| Source code | Root HTML files, css/, js/, server/, scripts/, package.json, package-lock.json |\n| Database scripts and backup | db/schema.sql, db/seed.js, db/setup.js, db/backups/dukaan-backup-*.db, db/dukaan-dump.sql |\n| API details | docs/ACTIVITY6.md and docs/API_ENDPOINTS.md |\n| Frontend and backend evidence | evidence/frontend-backend-evidence.md, evidence/server-access-log.txt, evidence/screenshots/ |\n| Authentication and authorization testing | evidence/tests-output.txt and evidence/api-evidence.md |\n| Demonstration of both modules | DEMO_SCRIPT.md and MY_MODULE/README.md |\n\n## Run\n\nRun \`npm install\`, \`npm run setup\`, and \`npm start\`. Open http://localhost:3000.\n\n## Demo accounts\n\n| Role | Email | Password |\n| --- | --- | --- |\n| Admin | admin@dukaansaathi.pk | Admin@12345 |\n| Owner | shopowner@dukaansaathi.pk | Shop@12345 |\n| Owner | bilal@dukaansaathi.pk | Bilal@12345 |\n\nThese credentials are for the seeded demo database.\n`;

const demoScript = `# Activity 6 Demonstration\n\n1. Run \`npm install\`, \`npm run setup\`, and \`npm start\`. Open http://localhost:3000/login.html, sign in as the demo owner, and show the JWT returned by POST /api/auth/login with the token shortened before sharing evidence.\n2. Send the JWT to GET /api/auth/me and show the owner identity returned by the server.\n3. Call GET /api/auth/me without a token, with garbage, with a tampered payload, with alg=none, and with an expired token. Each returns 401.\n4. Call PATCH /api/admin/shops/:id/status with the owner token and show 403. Call GET /api/khata/customers with the admin token and show 403.\n5. Add a customer and Khata entry through app-khata.html. Reload and show the saved entry and computed balance. The SQLite backup and dump show the database design.\n6. Muhammad Mubeen demonstrates registration, Pending status, admin approval, and visibility in Browse Shops. Ahmad Abdullah demonstrates the ledger, payment, phone reveal, and tenant isolation. Follow MY_MODULE/README.md for each member’s detailed steps.\n\nUse evidence/api-evidence.md and evidence/tests-output.txt for reproducible request and response records.\n`;

module.exports = { memberModule, index, demoScript };
