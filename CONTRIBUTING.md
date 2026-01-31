# Contributing to My Dev Deck

Thank you for your interest in contributing to My Dev Deck! This document provides guidelines and instructions for contributing to this project.

## 🌟 Ways to Contribute

- **Report bugs** by opening an issue
- **Suggest features** through feature requests
- **Improve documentation** with clearer explanations or examples
- **Submit code** via pull requests
- **Review pull requests** from other contributors
- **Share the project** with other developers

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 10.19.0
- Git
- PostgreSQL (for backend development)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/my-dev-deck.git
   cd my-dev-deck
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/my-dev-deck.git
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   ```

5. **Set up environment variables**
   ```bash
   # Copy example env files (once created)
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

6. **Start development servers**
   ```bash
   # Run all apps
   pnpm dev

   # Or run specific apps
   pnpm --filter web dev       # Dashboard (port 3001)
   pnpm --filter api start:dev # API (port 3000)
   ```

## 📝 Development Workflow

### Creating a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Making Changes

1. **Write code** following our style guidelines
2. **Test your changes** thoroughly
3. **Update documentation** if needed
4. **Commit your changes** with clear messages

### Commit Message Guidelines

We follow conventional commit format:

```
type(scope): short description

Longer description if needed

Co-Authored-By: Your Name <your.email@example.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

**Examples:**
```bash
feat(devinbox): add email list pagination
fix(api): resolve SMTP connection timeout
docs(readme): update installation instructions
chore(deps): update dependencies
```

### Running Tests

```bash
# Run all tests
pnpm --filter api test

# Run tests in watch mode
pnpm --filter api test:watch

# Run tests with coverage
pnpm --filter api test:cov

# Type checking
pnpm check-types

# Linting
pnpm lint
```

### Submitting a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub
   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

3. **Wait for review**
   - Address any feedback
   - Keep your PR updated with main branch
   - Be patient and respectful

4. **After approval**, your PR will be merged!

## 🎨 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types that might be reused

### Formatting

- We use Prettier for code formatting
- Run `pnpm format` before committing
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required

### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router conventions
- Keep components focused and reusable
- Use Tailwind CSS for styling with `ui-` prefix in shared components

### NestJS

- Follow NestJS module structure
- Use dependency injection
- Keep controllers thin, logic in services
- Write tests for services

## 📦 Project Structure

```
my-dev-deck/
├── apps/
│   ├── web/          # Next.js dashboard
│   ├── docs/         # Documentation site
│   └── api/          # NestJS backend
├── packages/
│   ├── ui/           # Shared components
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
└── ...
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, browser)
- **Screenshots** or error messages if applicable
- **Code samples** if relevant

## 💡 Suggesting Features

For feature requests:

- **Check existing issues** to avoid duplicates
- **Describe the problem** your feature solves
- **Provide examples** of how it would work
- **Consider implementation** if possible
- **Be open to discussion** and alternatives

## 🔍 Code Review Process

All pull requests require:

- ✅ Passing CI/CD checks (linting, type checking, tests)
- ✅ Code review from at least one maintainer
- ✅ Up-to-date with main branch
- ✅ Clear description and purpose
- ✅ No merge conflicts

## 📚 Documentation

When adding features:

- Update relevant README files
- Add inline code comments for complex logic
- Update CLAUDE.md if architecture changes
- Add examples for new APIs

## ⚖️ Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 📜 License

By contributing to My Dev Deck, you agree that your contributions will be licensed under the MIT License.

## 🤝 Getting Help

- **Questions?** Open a discussion on GitHub
- **Stuck?** Check existing issues or ask in PR comments
- **General chat?** Reach out to maintainers

## 🎯 Priority Areas

Current focus areas where contributions are especially welcome:

1. **DevInbox Implementation** - Following the implementation plan
2. **Documentation** - Improving guides and examples
3. **Testing** - Adding test coverage
4. **Docker Setup** - Creating development containers
5. **CI/CD** - Improving automation

## 📈 Development Roadmap

See [DEVINBOX_IMPLEMENTATION_PLAN.md](./DEVINBOX_IMPLEMENTATION_PLAN.md) for the current development roadmap.

---

Thank you for contributing to My Dev Deck! Your efforts help make developer tools better for everyone. 🙏
