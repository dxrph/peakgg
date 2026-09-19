import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "../i18n";
import App from "../App";
import Navbar from "../components/Navbar";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); document.body.style.overflow = ""; });

describe("navigation", () => {
  it("gives every homepage fragment link an existing destination", () => {
    const { container } = render(<App />);
    for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(document.getElementById(link.hash.slice(1)), link.hash).not.toBeNull();
    }
    expect(screen.getByText(/live data unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/1,284 players online/)).not.toBeInTheDocument();
  });

  it("traps mobile focus, closes on Escape and restores scrolling and focus", () => {
    document.body.style.overflow = "auto";
    render(<Navbar />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: /Close menu/ });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(within(dialog).getByRole("link", { name: "Enter Peak" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("closes the mobile panel after selecting a destination", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Tournaments" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("renders an explicit 404 for unknown routes", () => {
    window.history.replaceState({}, "", "/missing-page");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.queryByText("Platform preview · live data unavailable")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to PeakGG" })).toHaveAttribute("href", "/");
  });
});
