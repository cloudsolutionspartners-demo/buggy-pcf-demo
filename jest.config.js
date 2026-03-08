/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['./jest.setup.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    jsx: 'react-jsx',
                    module: 'commonjs',
                    esModuleInterop: true,
                    moduleResolution: 'node',
                    typeRoots: ['node_modules/@types'],
                    types: ['jest', '@testing-library/jest-dom', 'node', 'powerapps-component-framework'],
                    strict: false,
                },
            },
        ],
    },
    moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
    },
};
