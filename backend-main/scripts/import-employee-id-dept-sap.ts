import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { employeeIdDeptSap } from "@/db/schema";

// required: bun add xlsx
// docker run: docker compose exec backend-main bun run scripts/import-employee-id-dept-sap.ts --file ref_emp_to_deptsap.xlsx

function normalizeEmployeeId(v: unknown): string | null {
  if (v == null) return null;

  const s = String(v).replace(/\s+/g, "").trim();
  return s ? s : null;
}

function normalizeDeptSap(v: unknown): number | null {
  if (v == null) return null;

  const s = String(v).replace(/\s+/g, "").trim();
  if (!s) return null;

  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

async function main() {
  const fileArgIndex = process.argv.indexOf("--file");
  const fileName = fileArgIndex >= 0 ? process.argv[fileArgIndex + 1] : null;

  if (!fileName) {
    console.error(
      "Usage: bun run scripts/import-employee-id-dept-sap.ts --file ref_emp_to_deptsap.xlsx"
    );
    process.exit(1);
  }

  if (!fileName.endsWith(".xlsx")) {
    console.error("Only .xlsx files are allowed");
    process.exit(1);
  }

  const XLSX_DIR = path.resolve(process.cwd(), "xlsx_files");
  const filePath = path.join(XLSX_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  console.log("Reading file:", filePath);

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: false,
  });

  const mappedRows = rows
    .map((row, index) => {
      const employeeId = normalizeEmployeeId(row.employee_id);
      const deptSap = normalizeDeptSap(row.dept_sap);

      if (!employeeId) {
        console.warn(`Skip row ${index + 2}: invalid employee_id`);
        return null;
      }

      return {
        employeeId,
        deptSap,
      };
    })
    .filter(
      (
        row
      ): row is {
        employeeId: string;
        deptSap: number | null;
      } => Boolean(row)
    );

  if (mappedRows.length === 0) {
    console.log("No valid data found in columns: employee_id, dept_sap");
    return;
  }

  const uniqueRows = Array.from(
    new Map(mappedRows.map((row) => [row.employeeId, row])).values()
  );

  console.log(`Found ${uniqueRows.length} unique rows`);

  const BATCH_SIZE = 500;
  let insertedTotal = 0;

  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const chunk = uniqueRows.slice(i, i + BATCH_SIZE);

    const inserted = await db
      .insert(employeeIdDeptSap)
      .values(
        chunk.map((row) => ({
          employeeId: row.employeeId,
          deptSap: row.deptSap,
        }))
      )
      .onConflictDoNothing()
      .returning({ employeeId: employeeIdDeptSap.employeeId });

    insertedTotal += inserted.length;

    console.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${inserted.length}/${chunk.length}`
    );
  }

  console.log("================================");
  console.log("Import completed");
  console.log("Total valid unique rows:", uniqueRows.length);
  console.log("Inserted rows:", insertedTotal);
}

main().catch((err) => {
  console.error("Import failed:");
  console.error(err);
  process.exit(1);
});
