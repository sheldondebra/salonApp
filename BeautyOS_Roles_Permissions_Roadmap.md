# BeautyOS Roles & Permissions Roadmap

This roadmap builds a complete role-based access control system for BeautyOS.

Use one batch at a time in Cursor.
Always inspect existing code first.
Do not rebuild from scratch.
Reuse existing tenant, auth, staff, dashboard, mobile, and API patterns.

Important cross-platform rule:
Every feature must include:
1. Laravel backend API
2. Web frontend
3. Mobile phone UI
4. Mobile tablet UI

Mobile/tablet must support 60-80% of daily shop operations for businesses without laptops.

---

## Feature Goal

Build a professional roles and permissions system where Super Admin, Office Admin, Tenant Owner, Managers, Staff, and Clients have the right access.

The system should support:

- Default system roles
- Tenant-level custom roles
- Permission groups
- CRUD permissions
- Module permissions
- Staff-specific permissions
- Mobile access permissions
- Permission templates
- Audit logs
- Safe permission checks on backend and frontend

---

## Default Roles

Platform roles:

- Super Admin
- Office Admin
- Support Agent
- Finance Admin

Tenant roles:

- Tenant Owner
- Branch Manager
- Receptionist
- Staff
- Senior Staff
- Accountant
- Marketing Manager
- Inventory Manager
- Client

---

## Permission Actions

Every major module should support:

- view
- create
- update
- delete
- restore
- export
- approve
- reject
- manage
- assign
- deactivate

---

## Permission Modules

Permissions should be grouped by module:

- dashboard
- tenants
- branches
- staff
- services
- customers
- appointments
- schedule
- time_off
- payroll
- payments
- subscriptions
- coupons
- inventory
- pos
- reports
- sms
- sender_ids
- marketing
- reviews
- domains
- branding
- settings
- roles
- permissions
- audit_logs
- support
- mobile_app

Permission example:

```text
staff.view
staff.create
staff.update
staff.delete
staff.assign_services
staff.manage_schedule
staff.manage_time_off
staff.manage_payroll
appointments.view
appointments.create
appointments.update
appointments.cancel
reports.export