/* eslint-disable no-undef */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a very small fetch mock if not present
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn(async (url, opts = {}) => {
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true, url, method: opts.method || "GET", body: opts.body, headers: opts.headers || {} }),
      text: async () => "",
    };
  });
}
