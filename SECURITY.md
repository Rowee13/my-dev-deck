# Security Policy

## Supported Versions

As this project is in active development, security updates will be applied to the latest version on the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately:

1. **Email**: Send details to the maintainer (update with actual email)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature (recommended)
   - Go to the "Security" tab
   - Click "Report a vulnerability"
   - Fill out the form with details

### What to Include

When reporting a vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### Response Timeline

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 1 week
- **Status Updates**: Every week until resolution
- **Fix & Disclosure**: Coordinated disclosure after fix is deployed

## Security Best Practices

When contributing to this project:

### Secrets Management
- Never commit API keys, passwords, or tokens
- Use environment variables for sensitive data
- Check `.env.example` files for required configuration
- Ensure `.env` files are in `.gitignore`

### Dependencies
- Keep dependencies up to date
- Review security advisories from GitHub Dependabot
- Use `pnpm audit` to check for vulnerabilities

### Code Review
- All PRs require review before merging
- CI/CD runs automated security checks
- Type safety helps prevent common vulnerabilities

### Database
- Use parameterized queries (Prisma handles this)
- Validate and sanitize all user input
- Follow principle of least privilege for database access

### API Security
- Implement rate limiting
- Validate request payloads
- Sanitize HTML content to prevent XSS
- Use CORS appropriately
- Never expose sensitive data in error messages

## Security Features

Current security measures in the project:

- ✅ TypeScript for type safety
- ✅ ESLint for code quality and security patterns
- ✅ Environment variable management
- ✅ `.gitignore` for sensitive files
- ✅ CI/CD security checks
- ✅ Dependency scanning (GitHub Dependabot)

Planned security enhancements:

- [ ] Authentication system (OAuth/JWT)
- [ ] Rate limiting on API endpoints
- [ ] SMTP security (rate limits, size limits)
- [ ] Content Security Policy (CSP) headers
- [ ] HTTPS/TLS configuration guide

## Security Updates

Security patches will be:
- Released as soon as possible after verification
- Documented in commit messages and release notes
- Announced in GitHub Security Advisories if severe

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report vulnerabilities (with permission).

---

Thank you for helping keep My Dev Deck and its users safe!
