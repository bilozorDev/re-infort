export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(","),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (value === null || value === undefined) {
          return "";
        }
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    )
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    // Feature detection for download attribute
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToExcel(data: unknown, filename: string) {
  // For now, export as CSV with .xls extension
  // A full Excel export would require a library like xlsx or exceljs
  const dataObj = data as { headers?: string[]; data?: unknown[][] } | unknown[];
  
  if (!dataObj || (!('data' in dataObj && dataObj.data) && !Array.isArray(dataObj))) {
    console.error("No data to export");
    return;
  }

  let csvContent = "";
  
  // Handle data with headers and data properties
  if ('headers' in dataObj && dataObj.headers && 'data' in dataObj && dataObj.data) {
    csvContent = [
      dataObj.headers.join("\t"),
      ...dataObj.data.map((row) => (row as unknown[]).join("\t"))
    ].join("\n");
  } else if (Array.isArray(data) && data.length > 0) {
    // Handle array of objects
    const headers = Object.keys(data[0]);
    csvContent = [
      headers.join("\t"),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) {
            return "";
          }
          return String(value);
        }).join("\t")
      )
    ].join("\n");
  }

  // Create blob and download with .xls extension
  const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}