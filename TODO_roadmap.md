# Future Roadmap (Deferred)

These items were identified during the initial analysis but deferred to prioritize feature development.

## 🚨 Immediate Infrastructure Fixes
- [x] **Docker Port Conflict**: Frontend maps `3000:80` which conflicts with Backend on `3000`. Move frontend ports or expose backend properly.
- [x] **Repository Cleanup**: Consolidate redundant READMEs and clarify `docker-compose.yml` location.

## 🧪 Testing & Stability
- [ ] **Backend Tests**: Fix boilerplate tests and mock `PrismaService`.
- [ ] **Frontend Tests**: Setup `Vitest` and `React Testing Library`.

## 🤖 AI & Documentation
- [ ] **Context File**: Create `ARCHITECTURE.md` for AI context.
- [ ] **OpenAPI**: Complete Swagger documentation annotations.

## 🚀 DevOps
- [ ] **CI/CD**: Add GitHub Actions workflow.
