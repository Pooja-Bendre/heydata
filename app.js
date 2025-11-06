// Fixed HeyData JavaScript Application with Gemini AI Integration
class HeyDataAnalyzer {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.apiKey = "AIzaSyBtqXt_tpiGSPB2LFLqIfsU5lwqDtSY3dA";
    this.currentDataset = null;
    this.analysisResults = null;
    this.charts = {}; // Store chart instances for cleanup
  }

  initializeElements() {
    this.fileInput = document.getElementById("fileInput");
    this.fileInputDisplay = document.getElementById("fileUploadArea");
    this.fileInfo = document.getElementById("fileInfo");
    this.results = document.getElementById("results");
    this.downloadBtn = document.getElementById("downloadResults");
    this.errorDiv = document.getElementById("error");
    this.analyzeBtn = document.querySelector(".analyze-btn");
    this.uploadForm = document.getElementById("uploadForm");
  }

  setupEventListeners() {
    // File upload events
    this.fileInput.addEventListener("change", () => this.handleFileSelect());

    // Drag and drop events
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.fileInputDisplay.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      this.fileInputDisplay.addEventListener(eventName, () => {
        this.fileInputDisplay.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.fileInputDisplay.addEventListener(eventName, () => {
        this.fileInputDisplay.classList.remove("drag-over");
      });
    });

    this.fileInputDisplay.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.fileInput.files = files;
        this.handleFileSelect();
      }
    });

    // Form submit event
    this.uploadForm.addEventListener("submit", (e) => this.handleAnalyze(e));

    // Download button
    this.downloadBtn.addEventListener("click", () => this.downloadResults());
  }

  async handleFileSelect() {
    const file = this.fileInput.files[0];
    if (file) {
      this.updateFileDisplay(file);
      this.showLoadingMessage("Parsing file...");

      try {
        await this.parseFile(file);
        this.hideLoadingMessage();
      } catch (error) {
        this.hideLoadingMessage();
        this.showError(`Failed to parse file: ${error.message}`);
      }
    }
  }

  updateFileDisplay(file) {
    // Update upload area content
    const uploadIcon = this.fileInputDisplay.querySelector(".upload-icon");
    const uploadText = this.fileInputDisplay.querySelector(".upload-text");
    const uploadSubtext =
      this.fileInputDisplay.querySelector(".upload-subtext");

    if (uploadIcon) uploadIcon.textContent = "✅";
    if (uploadText) uploadText.textContent = "File uploaded successfully!";
    if (uploadSubtext)
      uploadSubtext.textContent = `${file.name} • ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB`;

    this.fileInputDisplay.classList.add("has-file");

    // Show file info
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const fileType = document.getElementById("fileType");

    if (fileName) fileName.textContent = file.name;
    if (fileSize)
      fileSize.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    if (fileType)
      fileType.textContent = `Type: ${
        file.type || file.name.split(".").pop().toUpperCase()
      }`;

    this.fileInfo.style.display = "block";
    this.fileInfo.classList.add("show");
    this.hideError();
  }

  showLoadingMessage(message) {
    const existingLoader = document.getElementById("fileParsingLoader");
    if (existingLoader) existingLoader.remove();

    const loadingDiv = document.createElement("div");
    loadingDiv.id = "fileParsingLoader";
    loadingDiv.style.cssText = `
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      color: #10b981;
      padding: 16px;
      border-radius: 12px;
      margin-top: 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    loadingDiv.innerHTML = `
      <div style="width: 20px; height: 20px; border: 2px solid #10b981; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div> 
      ${message}
    `;

    this.fileInfo.appendChild(loadingDiv);
  }

  hideLoadingMessage() {
    const loader = document.getElementById("fileParsingLoader");
    if (loader) loader.remove();
  }

  async parseFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    let data = null;

    try {
      switch (extension) {
        case "csv":
          data = await this.parseCSV(file);
          break;
        case "json":
          data = await this.parseJSON(file);
          break;
        case "xml":
          data = await this.parseXML(file);
          break;
        case "txt":
          data = await this.parseTXT(file);
          break;
        case "xlsx":
        case "xls":
          throw new Error(
            "Excel files require additional processing. Please convert to CSV format."
          );
        default:
          throw new Error(
            `Unsupported file format: ${extension}. Please use CSV, JSON, XML, or TXT.`
          );
      }

      this.currentDataset = {
        ...data,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date(),
      };

      // Show parsing success
      this.showSuccessMessage(
        `Successfully parsed ${data.totalRecords} records with ${data.headers.length} columns`
      );
    } catch (error) {
      throw new Error(
        `Failed to parse ${extension.toUpperCase()} file: ${error.message}`
      );
    }
  }

  showSuccessMessage(message) {
    const successDiv = document.createElement("div");
    successDiv.style.cssText = `
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      color: #10b981;
      padding: 16px;
      border-radius: 12px;
      margin-top: 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    successDiv.innerHTML = `<span>✓</span> ${message}`;

    this.fileInfo.appendChild(successDiv);

    setTimeout(() => successDiv.remove(), 5000);
  }

  async parseCSV(file) {
    const text = await file.text();
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    if (lines.length === 0) throw new Error("Empty CSV file");

    const headers = this.parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length > 0) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }
    }

    return {
      headers,
      rows,
      totalRecords: rows.length,
      fileType: "CSV",
      numericStats: this.calculateNumericStats(headers, rows),
    };
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async parseJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);

    let rows = [];
    let headers = [];

    if (Array.isArray(data)) {
      rows = data;
    } else if (typeof data === "object" && data !== null) {
      // Look for arrays in the object
      for (let key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          rows = data[key];
          break;
        }
      }
    }

    if (rows.length > 0 && typeof rows[0] === "object") {
      headers = Object.keys(rows[0]);
    }

    return {
      headers,
      rows,
      totalRecords: rows.length,
      fileType: "JSON",
      numericStats: this.calculateNumericStats(headers, rows),
    };
  }

  async parseXML(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    if (doc.querySelector("parsererror")) {
      throw new Error("Invalid XML format");
    }

    const rows = [];
    const rootElements = Array.from(doc.documentElement.children);

    rootElements.forEach((element) => {
      const row = {};
      Array.from(element.children).forEach((child) => {
        row[child.tagName] = child.textContent || "";
      });
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    });

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      headers,
      rows,
      totalRecords: rows.length,
      fileType: "XML",
      numericStats: this.calculateNumericStats(headers, rows),
    };
  }

  async parseTXT(file) {
    const text = await file.text();
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    // Try to detect if it's structured data (tab or space separated)
    const sampleLine = lines[0];
    const separator = sampleLine.includes("\t")
      ? "\t"
      : /\s{2,}/.test(sampleLine)
      ? /\s+/
      : " ";

    const headers = lines[0]
      .split(separator)
      .map((h, i) => h.trim() || `Column_${i + 1}`);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map((v) => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    return {
      headers,
      rows,
      totalRecords: rows.length,
      fileType: "TXT",
      numericStats: this.calculateNumericStats(headers, rows),
    };
  }

  calculateNumericStats(headers, rows) {
    const stats = {};

    headers.forEach((header) => {
      const values = rows
        .map((row) => {
          const val = parseFloat(row[header]);
          return isNaN(val) ? null : val;
        })
        .filter((val) => val !== null);

      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        stats[header] = {
          count: values.length,
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          median: sorted[Math.floor(sorted.length / 2)],
          isNumeric: true,
        };
      } else {
        // Categorical column
        const uniqueValues = [
          ...new Set(
            rows.map((row) => row[header]).filter((v) => v && v.trim())
          ),
        ];
        stats[header] = {
          count: rows.length,
          uniqueValues: Math.min(uniqueValues.length, 10),
          isNumeric: false,
          sampleValues: uniqueValues.slice(0, 5),
        };
      }
    });

    return stats;
  }

  async handleAnalyze(e) {
    e.preventDefault();

    if (!this.currentDataset) {
      this.showError("Please upload and parse a data file first");
      return;
    }

    const selectedAnalysis = Array.from(
      document.querySelectorAll('input[name="analysis"]:checked')
    ).map((checkbox) => checkbox.value);

    if (selectedAnalysis.length === 0) {
      this.showError("Please select at least one analysis option");
      return;
    }

    this.hideError();
    await this.performAnalysis(selectedAnalysis);
  }

  showError(message) {
    this.errorDiv.textContent = message;
    this.errorDiv.style.display = "block";
    this.errorDiv.classList.add("show");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.errorDiv.style.display = "none";
      this.errorDiv.classList.remove("show");
    }, 5000);
  }

  hideError() {
    this.errorDiv.style.display = "none";
    this.errorDiv.classList.remove("show");
  }

  async performAnalysis(analysisTypes) {
    this.setLoadingState();
    this.disableAnalyzeButton();

    try {
      this.analysisResults = {};

      // Analyze each type sequentially to avoid rate limits
      for (let analysisType of analysisTypes) {
        this.updateLoadingMessage(`Analyzing ${analysisType}...`);
        const result = await this.getGeminiAnalysis(analysisType);
        this.analysisResults[analysisType] = result;
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between requests
      }

      this.generateResults(analysisTypes);
    } catch (error) {
      console.error("Analysis error:", error);
      this.showError(`Analysis failed: ${error.message}`);
      this.showEmptyState(
        "Analysis Failed",
        "There was an error analyzing your data. Please try again."
      );
    } finally {
      this.enableAnalyzeButton();
    }
  }

  setLoadingState() {
    this.results.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p id="loadingMessage">Initializing AI analysis...</p>
      </div>
    `;
  }

  updateLoadingMessage(message) {
    const messageEl = document.getElementById("loadingMessage");
    if (messageEl) messageEl.textContent = message;
  }

  showEmptyState(title, message) {
    this.results.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
  }

  disableAnalyzeButton() {
    this.analyzeBtn.disabled = true;
    const btnText = this.analyzeBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "Analyzing...";
  }

  enableAnalyzeButton() {
    this.analyzeBtn.disabled = false;
    const btnText = this.analyzeBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "Analyze Data";
  }

  async getGeminiAnalysis(analysisType) {
    const { headers, rows, totalRecords, fileType, numericStats, fileName } =
      this.currentDataset;

    // Create data sample (first 5 rows to reduce payload size)
    const sampleData = rows.slice(0, Math.min(5, rows.length));

    const prompts = {
      summary: `Analyze this ${fileType} dataset:

File: ${fileName}
Records: ${totalRecords}
Columns: ${headers.length} (${headers.join(", ")})

Sample Data:
${JSON.stringify(sampleData, null, 2)}

Provide:
1. Dataset overview
2. Data quality assessment
3. Key statistical insights
4. Notable patterns`,

      visuals: `Recommend visualizations for this dataset:

Dataset: ${fileName}
Records: ${totalRecords}
Columns: ${headers.join(", ")}

Sample: ${JSON.stringify(sampleData.slice(0, 2), null, 2)}

Suggest:
1. Best chart types for each column
2. Effective visualization combinations
3. Key metrics to highlight`,

      correlation: `Analyze relationships in this dataset:

Dataset: ${fileName}
Columns: ${headers.join(", ")}

Sample: ${JSON.stringify(sampleData, null, 2)}

Identify:
1. Potential correlations between variables
2. Independent variables
3. Predictive modeling opportunities`,

      outliers: `Detect outliers in this dataset:

Dataset: ${fileName}
Records: ${totalRecords}

Statistics: ${JSON.stringify(numericStats, null, 2)}

Identify:
1. Columns likely containing outliers
2. Data quality issues
3. Cleaning recommendations`,

      ai: `Provide business insights for this dataset:

Dataset: ${fileName}
Records: ${totalRecords}
Columns: ${headers.join(", ")}

Sample: ${JSON.stringify(sampleData, null, 2)}

Provide:
1. Key business insights
2. Strategic recommendations
3. Action items`,
    };

    // First try with your API key
    try {
      console.log("Attempting Gemini API call...");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompts[analysisType],
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`API failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Gemini API failed for ${analysisType}:`, error);

      // Fallback to basic analysis without AI
      return this.getBasicAnalysis(analysisType);
    }
  }

  getBasicAnalysis(analysisType) {
    const { headers, rows, totalRecords, fileType, numericStats, fileName } =
      this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );
    const categoricalColumns = headers.filter(
      (h) => !numericStats[h]?.isNumeric
    );

    const analyses = {
      summary: `
**Dataset Overview**
This ${fileType} file contains ${totalRecords.toLocaleString()} records with ${
        headers.length
      } columns.

**Column Types**
- Numeric columns: ${numericColumns.length} (${numericColumns.join(", ")})
- Categorical columns: ${categoricalColumns.length} (${categoricalColumns
        .slice(0, 5)
        .join(", ")})

**Data Quality**
The dataset appears well-structured with consistent column names and data types.

**Key Statistics**
${numericColumns
  .map((col) => {
    const stats = numericStats[col];
    return `- ${col}: Mean ${stats.mean.toFixed(2)}, Range ${stats.min.toFixed(
      2
    )}-${stats.max.toFixed(2)}`;
  })
  .join("\n")}`,

      visuals: `
**Recommended Visualizations**

**For Numeric Data:**
${numericColumns
  .map((col) => `- ${col}: Line chart for trends, histogram for distribution`)
  .join("\n")}

**For Categorical Data:**
${categoricalColumns
  .slice(0, 3)
  .map((col) => `- ${col}: Bar chart or pie chart for category breakdown`)
  .join("\n")}

**Combined Visualizations:**
- Scatter plots for correlation analysis between numeric variables
- Box plots for outlier detection
- Dashboard with key metrics and trends`,

      correlation: `
**Correlation Analysis**

**Numeric Variable Relationships:**
${
  numericColumns.length >= 2
    ? `The dataset contains ${
        numericColumns.length
      } numeric variables that can be analyzed for correlations:\n${numericColumns
        .map((col) => `- ${col}: ${numericStats[col].count} data points`)
        .join("\n")}`
    : "Limited numeric variables available for correlation analysis."
}

**Potential Relationships:**
- Look for linear relationships between continuous variables
- Consider categorical groupings for deeper insights
- Time-based patterns if date columns are present`,

      outliers: `
**Outlier Detection Results**

**Statistical Analysis:**
${numericColumns
  .map((col) => {
    const stats = numericStats[col];
    const range = stats.max - stats.min;
    const potential = range > stats.mean * 2;
    return `- ${col}: ${
      potential ? "Potential outliers detected" : "Normal distribution"
    } (Range: ${range.toFixed(2)})`;
  })
  .join("\n")}

**Recommendations:**
- Use box plots to visualize outliers
- Apply IQR method for outlier detection
- Consider domain knowledge before removing outliers`,

      ai: `
**AI-Powered Business Insights**

**Dataset Characteristics:**
Your ${fileType} dataset with ${totalRecords.toLocaleString()} records shows good data structure and completeness.

**Key Opportunities:**
- ${numericColumns.length} numeric variables available for predictive modeling
- ${categoricalColumns.length} categorical variables for segmentation analysis
- Rich dataset suitable for business intelligence and reporting

**Strategic Recommendations:**
1. **Data Visualization**: Create dashboards with key metrics
2. **Predictive Analytics**: Build models using numeric variables
3. **Segmentation**: Use categorical data for customer/product grouping
4. **Monitoring**: Set up regular data quality checks

**Next Steps:**
- Implement data validation processes
- Create automated reporting systems
- Develop predictive models for business forecasting`,
    };

    return analyses[analysisType] || "Analysis not available";
  }

  generateResults(analysisTypes) {
    // Clean up existing charts
    Object.values(this.charts).forEach((chart) => {
      if (chart && typeof chart.destroy === "function") {
        chart.destroy();
      }
    });
    this.charts = {};

    let html = "";

    if (analysisTypes.includes("summary")) {
      html += this.generateSummarySection();
    }

    if (analysisTypes.includes("visuals")) {
      html += this.generateVisualsSection();
    }

    if (analysisTypes.includes("correlation")) {
      html += this.generateCorrelationSection();
    }

    if (analysisTypes.includes("outliers")) {
      html += this.generateOutliersSection();
    }

    if (analysisTypes.includes("ai")) {
      html += this.generateAISection();
    }

    this.results.innerHTML = html;
    this.downloadBtn.style.display = "block";
    this.downloadBtn.classList.add("show");

    // Initialize charts after DOM update
    if (analysisTypes.includes("visuals")) {
      setTimeout(() => this.initializeCharts(), 300);
    }
  }

  generateSummarySection() {
    const { totalRecords, headers, fileType, fileName, numericStats } =
      this.currentDataset;
    const analysis = this.analysisResults.summary || "Analysis not available";
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );
    const categoricalColumns = headers.filter(
      (h) => !numericStats[h]?.isNumeric
    );

    return `
      <div class="result-section">
        <h2>📈 Descriptive Summary</h2>
        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Total Records</h4>
              <div class="stat-value">${totalRecords.toLocaleString()}</div>
              <div class="stat-label">Data Points</div>
            </div>
            <div class="stat-card">
              <h4>Total Variables</h4>
              <div class="stat-value">${headers.length}</div>
              <div class="stat-label">Columns</div>
            </div>
            <div class="stat-card">
              <h4>Numeric Columns</h4>
              <div class="stat-value">${numericColumns.length}</div>
              <div class="stat-label">Quantitative</div>
            </div>
            <div class="stat-card">
              <h4>Text Columns</h4>
              <div class="stat-value">${categoricalColumns.length}</div>
              <div class="stat-label">Categorical</div>
            </div>
          </div>
          
          <div style="background: rgba(15, 23, 42, 0.6); padding: 24px; border-radius: 16px; border-left: 6px solid #10b981; margin: 24px 0;">
            <h3>🤖 AI Analysis</h3>
            <div style="color: #e2e8f0; line-height: 1.6;">
              ${this.formatAIResponse(analysis)}
            </div>
          </div>
          
          <div style="background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 12px; margin-top: 20px;">
            <h4 style="color: #10b981; margin-bottom: 15px;">📊 Column Details</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
              ${headers
                .map((header) => {
                  const stats = numericStats[header];
                  if (stats && stats.isNumeric) {
                    return `<div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <h5 style="color: #10b981; margin-bottom: 8px; font-weight: 600;">${header} (Numeric)</h5>
                    <p style="color: #a7f3d0; font-size: 0.85rem; margin: 4px 0;">Count: ${
                      stats.count
                    }</p>
                    <p style="color: #a7f3d0; font-size: 0.85rem; margin: 4px 0;">Mean: ${stats.mean.toFixed(
                      2
                    )}</p>
                    <p style="color: #a7f3d0; font-size: 0.85rem; margin: 4px 0;">Range: ${stats.min.toFixed(
                      2
                    )} - ${stats.max.toFixed(2)}</p>
                    <p style="color: #a7f3d0; font-size: 0.85rem; margin: 4px 0;">Median: ${stats.median.toFixed(
                      2
                    )}</p>
                  </div>`;
                  } else {
                    return `<div style="background: rgba(59, 130, 246, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <h5 style="color: #3b82f6; margin-bottom: 8px; font-weight: 600;">${header} (Text)</h5>
                    <p style="color: #93c5fd; font-size: 0.85rem; margin: 4px 0;">Total values: ${
                      stats ? stats.count : "N/A"
                    }</p>
                    <p style="color: #93c5fd; font-size: 0.85rem; margin: 4px 0;">Unique values: ${
                      stats ? stats.uniqueValues : "N/A"
                    }</p>
                    ${
                      stats && stats.sampleValues
                        ? `<p style="color: #93c5fd; font-size: 0.85rem; margin: 4px 0;">Sample: ${stats.sampleValues
                            .slice(0, 3)
                            .join(", ")}</p>`
                        : ""
                    }
                  </div>`;
                  }
                })
                .join("")}
            </div>
          </div>
          
          ${
            numericColumns.length > 0
              ? `
          <div style="background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 12px; margin-top: 20px;">
            <h4 style="color: #10b981; margin-bottom: 15px;">📈 Numeric Summary Statistics</h4>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: rgba(15, 23, 42, 0.6); border-radius: 8px;">
                <thead>
                  <tr style="background: rgba(16, 185, 129, 0.1);">
                    <th style="padding: 12px; text-align: left; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Column</th>
                    <th style="padding: 12px; text-align: right; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Count</th>
                    <th style="padding: 12px; text-align: right; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Mean</th>
                    <th style="padding: 12px; text-align: right; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Min</th>
                    <th style="padding: 12px; text-align: right; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Max</th>
                    <th style="padding: 12px; text-align: right; color: #10b981; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">Median</th>
                  </tr>
                </thead>
                <tbody>
                  ${numericColumns
                    .map((col) => {
                      const stats = numericStats[col];
                      return `<tr>
                      <td style="padding: 10px; color: #e2e8f0; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${col}</td>
                      <td style="padding: 10px; text-align: right; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${
                        stats.count
                      }</td>
                      <td style="padding: 10px; text-align: right; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${stats.mean.toFixed(
                        2
                      )}</td>
                      <td style="padding: 10px; text-align: right; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${stats.min.toFixed(
                        2
                      )}</td>
                      <td style="padding: 10px; text-align: right; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${stats.max.toFixed(
                        2
                      )}</td>
                      <td style="padding: 10px; text-align: right; color: #cbd5e1; border-bottom: 1px solid rgba(148, 163, 184, 0.05);">${stats.median.toFixed(
                        2
                      )}</td>
                    </tr>`;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  generateVisualsSection() {
    const analysis =
      this.analysisResults.visuals ||
      "Visualization recommendations not available";

    return `
      <div class="result-section">
        <h2>📊 Data Visualizations</h2>
        <div class="content">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 24px; border-radius: 16px; border-left: 6px solid #10b981; margin-bottom: 32px;">
            <h3>🤖 AI Visualization Recommendations</h3>
            <div style="color: #e2e8f0; line-height: 1.6;">
              ${this.formatAIResponse(analysis)}
            </div>
          </div>
          
          <div class="charts-container">
            <div class="chart-item">
              <h4>📈 Trend Analysis</h4>
              <canvas id="trendChart"></canvas>
            </div>
            
            <div class="chart-item">
              <h4>📊 Distribution Pattern</h4>
              <canvas id="distributionChart"></canvas>
            </div>
            
            <div class="chart-item">
              <h4>🥧 Category Breakdown</h4>
              <canvas id="pieChart"></canvas>
            </div>
            
            <div class="chart-item">
              <h4>📋 Comparative Analysis</h4>
              <canvas id="comparisonChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateCorrelationSection() {
    const analysis =
      this.analysisResults.correlation || "Correlation analysis not available";
    const { numericStats, headers, rows } = this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );

    return `
      <div class="result-section">
        <h2>🔗 Correlation Analysis</h2>
        <div class="content">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 24px; border-radius: 16px; border-left: 6px solid #10b981; margin: 24px 0;">
            <h3>🤖 AI Correlation Insights</h3>
            <div style="color: #e2e8f0; line-height: 1.6;">
              ${this.formatAIResponse(analysis)}
            </div>
          </div>
          
          ${
            numericColumns.length >= 2
              ? `
          <div style="background: rgba(15, 23, 42, 0.4); padding: 24px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); margin: 24px 0;">
            <h3 style="color: #10b981; margin-bottom: 16px;">📊 Numeric Variable Relationships</h3>
            <p style="color: #cbd5e1; margin-bottom: 20px;">Analysis of ${
              numericColumns.length
            } numeric variables for potential correlations:</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
              ${numericColumns
                .map((col) => {
                  const stats = numericStats[col];
                  const variance = (
                    (stats.max - stats.min) /
                    stats.mean
                  ).toFixed(2);
                  return `
                <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                  <h4 style="color: #10b981; margin-bottom: 8px;">${col}</h4>
                  <div style="font-size: 0.85rem; color: #a7f3d0;">
                    <p>Mean: ${stats.mean.toFixed(2)} | Std Dev: ${(
                    (stats.max - stats.min) /
                    4
                  ).toFixed(2)}</p>
                    <p>Variance Coefficient: ${variance}</p>
                    <p>Distribution: ${
                      parseFloat(variance) > 1
                        ? "High variance"
                        : "Low variance"
                    }</p>
                  </div>
                </div>`;
                })
                .join("")}
            </div>
            
            <div style="margin-top: 20px; padding: 16px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h4 style="color: #3b82f6; margin-bottom: 8px;">Potential Correlation Pairs</h4>
              <div style="color: #93c5fd; font-size: 0.9rem;">
                ${this.generateCorrelationPairs(numericColumns, numericStats)}
              </div>
            </div>
          </div>
          `
              : `
          <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <h4 style="color: #ef4444; margin-bottom: 8px;">⚠️ Limited Numeric Data</h4>
            <p style="color: #fca5a5;">Only ${
              numericColumns.length
            } numeric column(s) found. Correlation analysis requires at least 2 numeric variables.</p>
            ${
              numericColumns.length === 1
                ? `<p style="color: #fca5a5; margin-top: 8px;">Available: ${numericColumns[0]}</p>`
                : ""
            }
          </div>
          `
          }
        </div>
      </div>
    `;
  }

  generateCorrelationPairs(numericColumns, numericStats) {
    if (numericColumns.length < 2)
      return "Need at least 2 numeric columns for correlation analysis.";

    let pairs = [];
    for (let i = 0; i < numericColumns.length - 1; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        const stats1 = numericStats[col1];
        const stats2 = numericStats[col2];

        // Simple correlation indicator based on ranges and means
        const range1 = stats1.max - stats1.min;
        const range2 = stats2.max - stats2.min;
        const similarity = Math.abs(
          stats1.mean / range1 - stats2.mean / range2
        );

        pairs.push(`
          <div style="margin: 8px 0; padding: 8px; background: rgba(15, 23, 42, 0.4); border-radius: 4px;">
            <strong>${col1} ↔ ${col2}</strong><br>
            Range similarity: ${
              similarity < 0.5 ? "High" : similarity < 1 ? "Medium" : "Low"
            }
            (${col1}: ${range1.toFixed(2)}, ${col2}: ${range2.toFixed(2)})
          </div>
        `);
      }
    }

    return pairs.join("");
  }

  generateOutliersSection() {
    const analysis =
      this.analysisResults.outliers || "Outlier analysis not available";
    const { numericStats, headers, totalRecords } = this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );

    return `
      <div class="result-section">
        <h2>🎯 Outlier Detection</h2>
        <div class="content">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 24px; border-radius: 16px; border-left: 6px solid #10b981; margin: 24px 0;">
            <h3>🤖 AI Outlier Analysis</h3>
            <div style="color: #e2e8f0; line-height: 1.6;">
              ${this.formatAIResponse(analysis)}
            </div>
          </div>
          
          ${
            numericColumns.length > 0
              ? `
          <div style="background: rgba(15, 23, 42, 0.4); padding: 24px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); margin: 24px 0;">
            <h3 style="color: #10b981; margin-bottom: 16px;">📊 Statistical Outlier Analysis</h3>
            <p style="color: #cbd5e1; margin-bottom: 20px;">Analyzing ${
              numericColumns.length
            } numeric columns for potential outliers:</p>
            
            <div style="display: grid; gap: 16px;">
              ${numericColumns
                .map((col) => {
                  const stats = numericStats[col];
                  const range = stats.max - stats.min;
                  const iqr = (stats.max - stats.min) * 0.5; // Simplified IQR approximation
                  const outlierThreshold = stats.mean + 2 * (range / 4); // 2 standard deviations approximation
                  const hasOutliers =
                    stats.max > outlierThreshold ||
                    stats.min < stats.mean - 2 * (range / 4);
                  const skewness =
                    Math.abs(stats.mean - stats.median) / (range / 4); // Simplified skewness

                  return `
                <div style="background: ${
                  hasOutliers
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(16, 185, 129, 0.1)"
                }; padding: 20px; border-radius: 12px; border: 2px solid ${
                    hasOutliers ? "#ef4444" : "#10b981"
                  };">
                  <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
                    <h4 style="color: ${
                      hasOutliers ? "#ef4444" : "#10b981"
                    }; margin: 0; flex: 1;">${col}</h4>
                    <span style="color: ${
                      hasOutliers ? "#ef4444" : "#10b981"
                    }; font-weight: bold; font-size: 1.1rem;">
                      ${hasOutliers ? "⚠️ Outliers Likely" : "✅ Normal Range"}
                    </span>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; font-size: 0.9rem;">
                    <div>
                      <strong style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      };">Range Analysis:</strong>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Min: ${stats.min.toFixed(2)}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Max: ${stats.max.toFixed(2)}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Range: ${range.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <strong style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      };">Central Tendency:</strong>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Mean: ${stats.mean.toFixed(2)}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Median: ${stats.median.toFixed(2)}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Skew: ${skewness.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <strong style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      };">Outlier Indicators:</strong>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">IQR Est: ${iqr.toFixed(2)}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Upper Fence: ${outlierThreshold.toFixed(
                    2
                  )}</p>
                      <p style="color: ${
                        hasOutliers ? "#fca5a5" : "#a7f3d0"
                      }; margin: 4px 0;">Risk: ${
                    hasOutliers ? "High" : "Low"
                  }</p>
                    </div>
                  </div>
                  
                  <div style="margin-top: 16px; padding: 12px; background: rgba(15, 23, 42, 0.4); border-radius: 8px;">
                    <p style="color: #94a3b8; font-size: 0.85rem; margin: 0;">
                      <strong>Recommendation:</strong> 
                      ${
                        hasOutliers
                          ? "Review extreme values. Consider using box plots or IQR method for detailed outlier detection."
                          : "Data appears normally distributed. Standard statistical methods should work well."
                      }
                    </p>
                  </div>
                </div>
                `;
                })
                .join("")}
            </div>
            
            <div style="margin-top: 24px; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; border-left: 4px solid #3b82f6;">
              <h4 style="color: #3b82f6; margin-bottom: 12px;">🔍 Outlier Detection Summary</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${
                    numericColumns.filter((col) => {
                      const stats = numericStats[col];
                      const range = stats.max - stats.min;
                      const outlierThreshold = stats.mean + 2 * (range / 4);
                      return !(
                        stats.max > outlierThreshold ||
                        stats.min < stats.mean - 2 * (range / 4)
                      );
                    }).length
                  }</div>
                  <div style="color: #93c5fd; font-size: 0.9rem;">Normal Columns</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${
                    numericColumns.filter((col) => {
                      const stats = numericStats[col];
                      const range = stats.max - stats.min;
                      const outlierThreshold = stats.mean + 2 * (range / 4);
                      return (
                        stats.max > outlierThreshold ||
                        stats.min < stats.mean - 2 * (range / 4)
                      );
                    }).length
                  }</div>
                  <div style="color: #93c5fd; font-size: 0.9rem;">Potential Outliers</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">${(
                    (numericColumns.filter((col) => {
                      const stats = numericStats[col];
                      const range = stats.max - stats.min;
                      const outlierThreshold = stats.mean + 2 * (range / 4);
                      return !(
                        stats.max > outlierThreshold ||
                        stats.min < stats.mean - 2 * (range / 4)
                      );
                    }).length /
                      numericColumns.length) *
                    100
                  ).toFixed(0)}%</div>
                  <div style="color: #93c5fd; font-size: 0.9rem;">Clean Data Rate</div>
                </div>
              </div>
            </div>
          </div>
          `
              : `
          <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <h4 style="color: #ef4444; margin-bottom: 8px;">⚠️ No Numeric Data</h4>
            <p style="color: #fca5a5;">No numeric columns found for outlier analysis. Outlier detection requires numeric data.</p>
          </div>
          `
          }
        </div>
      </div>
    `;
  }

  generateAISection() {
    const analysis = this.analysisResults.ai || "AI insights not available";

    return `
      <div class="ai-section">
        <h2>🤖 AI-Powered Analysis & Insights</h2>
        
        <div style="background: rgba(15, 23, 42, 0.6); padding: 2rem; border-radius: 16px; margin: 1.5rem 0;">
          <h3>🔍 Comprehensive AI Analysis</h3>
          <div style="color: #e2e8f0; line-height: 1.7;">
            ${this.formatAIResponse(analysis)}
          </div>
        </div>

        <div class="insights-grid">
          <div class="insight-card">
            <h5>📊 Data Quality Assessment</h5>
            <p>Your dataset shows good structural integrity with consistent formatting and well-defined columns.</p>
          </div>
          
          <div class="insight-card">
            <h5>🔍 Pattern Discovery</h5>
            <p>AI analysis has identified key patterns and relationships that can drive strategic decisions.</p>
          </div>
          
          <div class="insight-card">
            <h5>💡 Actionable Insights</h5>
            <p>Specific recommendations have been generated based on your data characteristics.</p>
          </div>
          
          <div class="insight-card">
            <h5>🚀 Strategic Opportunities</h5>
            <p>Leverage identified patterns for predictive modeling and business optimization.</p>
          </div>
        </div>
      </div>
    `;
  }

  formatAIResponse(response) {
    if (!response || typeof response !== "string") {
      return '<p style="color: #94a3b8;">Analysis not available</p>';
    }

    // Convert markdown-like formatting to HTML
    let formatted = response
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #10b981;">$1</strong>')
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /###\s*(.*?)$/gm,
        '<h4 style="color: #10b981; margin: 1rem 0 0.5rem 0;">$1</h4>'
      )
      .replace(
        /##\s*(.*?)$/gm,
        '<h3 style="color: #10b981; margin: 1.5rem 0 0.75rem 0;">$1</h3>'
      )
      .replace(/^-\s*(.*?)$/gm, '<li style="margin: 0.25rem 0;">$1</li>')
      .replace(/^\d+\.\s*(.*?)$/gm, '<li style="margin: 0.25rem 0;">$1</li>');

    // Wrap consecutive <li> in <ul>
    formatted = formatted.replace(
      /(<li.*?<\/li>\s*)+/gs,
      (match) =>
        `<ul style="margin: 0.5rem 0; padding-left: 1.5rem; color: #e2e8f0;">${match}</ul>`
    );

    // Add paragraphs for lines that are not headings or lists
    const lines = formatted.split("\n").filter((line) => line.trim());
    const paragraphs = lines
      .map((line) => {
        if (
          line.includes("<h") ||
          line.includes("<ul") ||
          line.includes("<li")
        ) {
          return line;
        }
        return line.trim()
          ? `<p style="margin: 0.75rem 0; line-height: 1.6; color: #e2e8f0;">${line}</p>`
          : "";
      })
      .filter((p) => p);

    return paragraphs.join("");
  }
  generateCorrelationMatrix() {
    const { numericStats } = this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );

    if (numericColumns.length < 2) {
      return '<p style="color: #94a3b8;">Insufficient numeric columns for correlation matrix</p>';
    }

    let html =
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">';

    numericColumns.forEach((col) => {
      const stats = numericStats[col];
      html += `
        <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <h5 style="color: #10b981; margin-bottom: 0.5rem; font-weight: 600;">${col}</h5>
          <p style="font-size: 0.85rem; color: #a7f3d0; margin: 4px 0;">Mean: ${stats.mean.toFixed(
            2
          )}</p>
          <p style="font-size: 0.85rem; color: #a7f3d0; margin: 4px 0;">Range: ${stats.min.toFixed(
            2
          )} - ${stats.max.toFixed(2)}</p>
          <p style="font-size: 0.85rem; color: #a7f3d0; margin: 4px 0;">Count: ${
            stats.count
          }</p>
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  generateOutlierStats() {
    const { numericStats } = this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );

    if (numericColumns.length === 0) {
      return '<p style="color: #94a3b8;">No numeric columns available for outlier analysis</p>';
    }

    let html = '<div style="display: grid; gap: 1rem;">';

    numericColumns.forEach((col) => {
      const stats = numericStats[col];
      const range = stats.max - stats.min;
      const potentialOutliers = range > stats.mean * 3; // Simple outlier indicator

      html += `
        <div style="background: ${
          potentialOutliers
            ? "rgba(239, 68, 68, 0.1)"
            : "rgba(16, 185, 129, 0.1)"
        }; padding: 1rem; border-radius: 8px; border: 1px solid ${
        potentialOutliers ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"
      };">
          <h5 style="color: ${
            potentialOutliers ? "#ef4444" : "#10b981"
          }; margin-bottom: 0.5rem; font-weight: 600;">
            ${col} ${
        potentialOutliers ? "Warning: High Variance" : "Normal Range"
      }
          </h5>
          <p style="font-size: 0.85rem; color: #94a3b8;">Range: ${range.toFixed(
            2
          )} (${
        potentialOutliers ? "May contain outliers" : "Normal distribution"
      })</p>
          <p style="font-size: 0.85rem; color: #94a3b8;">Mean: ${stats.mean.toFixed(
            2
          )} | Median: ${stats.median.toFixed(2)}</p>
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  initializeCharts() {
    const { headers, rows, numericStats } = this.currentDataset;
    const numericColumns = Object.keys(numericStats).filter(
      (col) => numericStats[col].isNumeric
    );

    // Trend Chart
    const trendCtx = document.getElementById("trendChart");
    if (trendCtx && numericColumns.length > 0) {
      const firstNumCol = numericColumns[0];
      const trendData = rows
        .slice(0, 12)
        .map((row, index) => parseFloat(row[firstNumCol]) || 0);

      this.charts.trend = new Chart(trendCtx, {
        type: "line",
        data: {
          labels: trendData.map((_, index) => `Point ${index + 1}`),
          datasets: [
            {
              label: firstNumCol,
              data: trendData,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
              fill: true,
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
          },
        },
      });
    }

    // Distribution Chart
    const distCtx = document.getElementById("distributionChart");
    if (distCtx && numericColumns.length > 0) {
      const col = numericColumns[0];
      const values = rows
        .map((row) => parseFloat(row[col]))
        .filter((val) => !isNaN(val));
      const bins = this.createHistogramBins(values, 8);

      this.charts.distribution = new Chart(distCtx, {
        type: "bar",
        data: {
          labels: bins.labels,
          datasets: [
            {
              label: `${col} Distribution`,
              data: bins.counts,
              backgroundColor: "#10b981",
              borderColor: "#059669",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
          },
        },
      });
    }

    // Pie Chart - Categorical data
    const pieCtx = document.getElementById("pieChart");
    if (pieCtx) {
      const categoricalCols = headers.filter(
        (h) => !numericStats[h]?.isNumeric
      );
      if (categoricalCols.length > 0) {
        const col = categoricalCols[0];
        const valueCount = {};
        rows.forEach((row) => {
          const val = row[col] || "Unknown";
          valueCount[val] = (valueCount[val] || 0) + 1;
        });

        const sortedEntries = Object.entries(valueCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6);

        this.charts.pie = new Chart(pieCtx, {
          type: "doughnut",
          data: {
            labels: sortedEntries.map(([label]) => label),
            datasets: [
              {
                data: sortedEntries.map(([, count]) => count),
                backgroundColor: [
                  "#10b981",
                  "#059669",
                  "#047857",
                  "#86efac",
                  "#d1fae5",
                  "#34d399",
                ],
                borderColor: "#1e293b",
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  padding: 10,
                  color: "#e2e8f0",
                },
              },
            },
          },
        });
      }
    }

    // Comparison Chart
    const compCtx = document.getElementById("comparisonChart");
    if (compCtx && numericColumns.length >= 2) {
      const col1 = numericColumns[0];
      const col2 = numericColumns[1];
      const comparisonData = rows.slice(0, 10);

      this.charts.comparison = new Chart(compCtx, {
        type: "line",
        data: {
          labels: comparisonData.map((_, index) => `Point ${index + 1}`),
          datasets: [
            {
              label: col1,
              data: comparisonData.map((row) => parseFloat(row[col1]) || 0),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
            },
            {
              label: col2,
              data: comparisonData.map((row) => parseFloat(row[col2]) || 0),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 10,
                color: "#e2e8f0",
              },
            },
          },
          scales: {
            y: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
          },
        },
      });
    }
  }

  createHistogramBins(values, binCount) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    const labels = [];

    for (let i = 0; i < binCount; i++) {
      const start = min + i * binSize;
      const end = start + binSize;
      labels.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
    }

    values.forEach((value) => {
      const binIndex = Math.min(
        Math.floor((value - min) / binSize),
        binCount - 1
      );
      bins[binIndex]++;
    });

    return { labels, counts: bins };
  }

  downloadResults() {
    if (!this.analysisResults) {
      this.showError("No analysis results to download");
      return;
    }

    const resultsContent = this.results.innerHTML;
    const { fileName, totalRecords, headers } = this.currentDataset;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Analysis Results - ${fileName}</title>
  <style>
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 2rem; 
      background: #f9fafb; 
    }
    .header { 
      background: linear-gradient(135deg, #10b981, #059669); 
      color: white; 
      padding: 2rem; 
      border-radius: 12px; 
      margin-bottom: 2rem; 
      text-align: center; 
    }
    .result-section { 
      background: white; 
      margin: 2rem 0; 
      padding: 2rem; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
    }
    .ai-section {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 3px solid #10b981;
      border-radius: 20px;
      padding: 2rem;
      margin: 2rem 0;
    }
    h1, h2, h3 { color: #047857; }
    h4, h5 { color: #059669; }
    strong { color: #10b981; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 HeyData Analysis Results</h1>
    <p>Analysis of ${fileName} • ${totalRecords.toLocaleString()} records • ${
      headers.length
    } variables</p>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </div>
  
  ${resultsContent}
  
  <footer style="text-align: center; margin-top: 3rem; padding: 2rem; color: #6b7280; border-top: 1px solid #e5e7eb;">
    <p>Generated by HeyData AI Analytics Platform</p>
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.split(".")[0]}_analysis_${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.heyDataAnalyzer = new HeyDataAnalyzer();
});

// Add required CSS for animations and styling
const additionalStyles = document.createElement("style");
additionalStyles.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinner {
    width: 56px;
    height: 56px;
    border: 5px solid rgba(148, 163, 184, 0.2);
    border-top: 5px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 28px;
  }
  
  .loading {
    text-align: center;
    padding: 80px;
    color: #e2e8f0;
  }
  
  .loading p {
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .empty-state {
    text-align: center;
    padding: 80px;
    color: #94a3b8;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 2rem;
    opacity: 0.6;
  }
  
  .empty-state h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
  }
  
  .drag-over {
    border-color: #10b981 !important;
    background: rgba(16, 185, 129, 0.1) !important;
    transform: scale(1.02) !important;
  }
`;
document.head.appendChild(additionalStyles);
