.PHONY: dev build start lint type-check clean install

# Development
dev:
	npm run dev

# Build for production
build:
	npm run build

# Start production server
start:
	npm start

# Lint code
lint:
	npm run lint

# Type check
type-check:
	npm run type-check

# Install dependencies
install:
	npm install

# Clean node_modules
clean:
	rm -rf node_modules package-lock.json

# Full setup
setup: install
	@echo "Frontend setup complete!"
	@echo "Run 'make dev' to start development server"

# Help
help:
	@echo "Available commands:"
	@echo "  dev         - Start development server"
	@echo "  build       - Build for production"
	@echo "  start       - Start production server"
	@echo "  lint        - Run ESLint"
	@echo "  type-check  - Run TypeScript type checking"
	@echo "  install     - Install dependencies"
	@echo "  clean       - Clean node_modules"
	@echo "  setup       - Full setup (install dependencies)"
	@echo "  help        - Show this help message"
