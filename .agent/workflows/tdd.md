---
description: Red-Green-Refactor development cycle for Easy-Flags.
---

// turbo-all
1. **Analyze Requirements**: Understand the feature or bug goal and edge cases.
2. **Identify/Create Test File**: Locate or create the corresponding `.test.ts` or `.test.tsx` file in the same directory as the source.
3. **Write the Test First**:
   - Provide the code for the failing test.
   - Ensure it fails for the right reason (e.g., function not defined, element not found).
4. **Verify Failure**: Run the test with `pnpm vitest run <test_file>` and confirm it fails.
5. **Implement Source Code**: Implement the minimum amount of code to make the test pass.
6. **Confirm Success**: Run the tests again to ensure they pass.
7. **Refactor**: Review for readability, performance, and best practices. Ensure tests still pass.
