verify:
	@echo "Running tests..."; pnpm test:run; \
	echo "Linting web..."; pnpm --filter web lint; \
	echo "Typechecking mobile..."; pnpm --filter mobile typecheck; \
	echo "✅ Verification complete."
