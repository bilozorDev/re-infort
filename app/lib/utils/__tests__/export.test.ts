import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportToCSV, exportToExcel } from "../export";

// Mock DOM elements and browser APIs
const mockLink = {
  setAttribute: vi.fn(),
  click: vi.fn(),
  style: { visibility: "" },
  download: true,
};

const mockBlob = vi.fn();
const mockCreateObjectURL = vi.fn().mockReturnValue("mock-blob-url");
const mockConsoleError = vi.fn();

describe("Export Utils", () => {
  beforeEach(() => {
    // Mock DOM APIs
    global.Blob = mockBlob as typeof Blob;
    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL;

    global.document = {
      createElement: vi.fn().mockReturnValue(mockLink),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as unknown as typeof document;

    // Mock console.error
    vi.spyOn(console, "error").mockImplementation(mockConsoleError);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("exportToCSV", () => {
    const mockData = [
      { id: 1, name: "Product 1", price: 100.5, active: true },
      { id: 2, name: "Product 2", price: 200.75, active: false },
    ];

    it("should export data to CSV format", () => {
      exportToCSV(mockData, "test-export");

      expect(mockBlob).toHaveBeenCalledWith(
        [expect.stringMatching(/id,name,price,active[\s\S]*1,Product 1,100\.5,true/)],
        { type: "text/csv;charset=utf-8;" }
      );
    });

    it("should handle values with commas by wrapping in quotes", () => {
      const dataWithCommas = [{ name: "Product, Special", description: "A product with, commas" }];

      exportToCSV(dataWithCommas, "test-export");

      expect(mockBlob).toHaveBeenCalled();
      const csvContent = mockBlob.mock.calls[0][0][0];
      expect(csvContent).toMatch(/"Product, Special"/);
      expect(csvContent).toMatch(/"A product with, commas"/);
    });

    it("should handle values with quotes by escaping them", () => {
      const dataWithQuotes = [{ name: 'Product "Special"', description: 'A "quoted" product' }];

      exportToCSV(dataWithQuotes, "test-export");

      expect(mockBlob).toHaveBeenCalled();
      const csvContent = mockBlob.mock.calls[0][0][0];
      expect(csvContent).toMatch(/"Product ""Special"""/);
      expect(csvContent).toMatch(/"A ""quoted"" product"/);
    });

    it("should handle null and undefined values", () => {
      const dataWithNulls = [{ name: "Product 1", price: null, description: undefined }];

      exportToCSV(dataWithNulls, "test-export");

      expect(mockBlob).toHaveBeenCalled();
      const csvContent = mockBlob.mock.calls[0][0][0];
      expect(csvContent).toMatch(/Product 1,,/);
    });

    it("should create and trigger download", () => {
      exportToCSV(mockData, "test-export");

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test-export.csv");
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle empty data", () => {
      exportToCSV([], "test-export");

      expect(mockConsoleError).toHaveBeenCalledWith("No data to export");
      expect(mockBlob).not.toHaveBeenCalled();
    });

    it("should handle null data", () => {
      exportToCSV(null as unknown as Record<string, unknown>[], "test-export");

      expect(mockConsoleError).toHaveBeenCalledWith("No data to export");
      expect(mockBlob).not.toHaveBeenCalled();
    });

    it("should handle browser without download support", () => {
      const linkWithoutDownload = { ...mockLink, download: undefined };
      vi.mocked(document.createElement).mockReturnValue(
        linkWithoutDownload as unknown as HTMLAnchorElement
      );

      exportToCSV(mockData, "test-export");

      expect(mockBlob).toHaveBeenCalled();
      expect(linkWithoutDownload.click).not.toHaveBeenCalled();
    });
  });

  describe("exportToExcel", () => {
    const mockData = [
      { id: 1, name: "Product 1", price: 100 },
      { id: 2, name: "Product 2", price: 200 },
    ];

    it("should export array data to Excel format", () => {
      exportToExcel(mockData, "test-export");

      expect(mockBlob).toHaveBeenCalledWith(
        [expect.stringMatching(/id\tname\tprice[\s\S]*1\tProduct 1\t100/)],
        { type: "application/vnd.ms-excel" }
      );
    });

    it("should export data with headers and data properties", () => {
      const structuredData = {
        headers: ["ID", "Name", "Price"],
        data: [
          [1, "Product 1", 100],
          [2, "Product 2", 200],
        ],
      };

      exportToExcel(structuredData, "test-export");

      const excelContent = mockBlob.mock.calls[0][0][0];
      expect(excelContent).toMatch(/ID\tName\tPrice/);
      expect(excelContent).toMatch(/1\tProduct 1\t100/);
    });

    it("should handle null and undefined values", () => {
      const dataWithNulls = [{ name: "Product 1", price: null, description: undefined }];

      exportToExcel(dataWithNulls, "test-export");

      const excelContent = mockBlob.mock.calls[0][0][0];
      expect(excelContent).toMatch(/Product 1\t\t/);
    });

    it("should create download with .xls extension", () => {
      exportToExcel(mockData, "test-export");

      expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test-export.xls");
      expect(mockBlob).toHaveBeenCalledWith([expect.any(String)], {
        type: "application/vnd.ms-excel",
      });
    });

    it("should handle empty array", () => {
      exportToExcel([], "test-export");

      // Empty arrays pass the initial check and create empty content
      expect(mockBlob).toHaveBeenCalledWith([""], { type: "application/vnd.ms-excel" });
    });

    it("should handle null data", () => {
      exportToExcel(null, "test-export");

      expect(mockConsoleError).toHaveBeenCalledWith("No data to export");
      expect(mockBlob).not.toHaveBeenCalled();
    });

    it("should handle structured data with empty data array", () => {
      const emptyStructuredData = {
        headers: ["ID", "Name"],
        data: [],
      };

      exportToExcel(emptyStructuredData, "test-export");

      const excelContent = mockBlob.mock.calls[0][0][0];
      expect(excelContent).toBe("ID\tName");
    });

    it("should handle malformed structured data", () => {
      const badData = { headers: ["ID"] }; // missing data property

      exportToExcel(badData, "test-export");

      expect(mockConsoleError).toHaveBeenCalledWith("No data to export");
    });

    it("should handle browser without download support", () => {
      const linkWithoutDownload = { ...mockLink, download: undefined };
      vi.mocked(document.createElement).mockReturnValue(
        linkWithoutDownload as unknown as HTMLAnchorElement
      );

      exportToExcel(mockData, "test-export");

      expect(mockBlob).toHaveBeenCalled();
      expect(linkWithoutDownload.click).not.toHaveBeenCalled();
    });
  });
});
