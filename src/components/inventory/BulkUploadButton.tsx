"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileSpreadsheet,
  Loader2,
  Upload,
  Download,
  AlertCircle,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { PantryItem } from "@/types";

const VALID_UNITS = ["unidades", "kg", "g", "L", "ml", "paquetes", "latas", "botellas"];

const UNIT_NORMALIZATIONS: Record<string, string> = {
  // Spanish variations
  "unidad": "unidades",
  "ud": "unidades",
  "uds": "unidades",
  "kilogramo": "kg",
  "kilogramos": "kg",
  "kilo": "kg",
  "kilos": "kg",
  "gramo": "g",
  "gramos": "g",
  "gr": "g",
  "litro": "L",
  "litros": "L",
  "l": "L",
  "mililitro": "ml",
  "mililitros": "ml",
  "paquete": "paquetes",
  "paq": "paquetes",
  "lata": "latas",
  "botella": "botellas",
  // English variations
  "unit": "unidades",
  "units": "unidades",
  "kilogram": "kg",
  "kilograms": "kg",
  "gram": "g",
  "grams": "g",
  "liter": "L",
  "liters": "L",
  "litre": "L",
  "litres": "L",
  "milliliter": "ml",
  "milliliters": "ml",
  "millilitre": "ml",
  "millilitres": "ml",
  "package": "paquetes",
  "packages": "paquetes",
  "can": "latas",
  "cans": "latas",
  "bottle": "botellas",
  "bottles": "botellas",
};

const COLUMN_MAPPINGS: Record<string, string> = {
  // Spanish
  "nombre": "name",
  "producto": "name",
  "cantidad": "quantity",
  "unidad": "unit",
  "caducidad": "expirationDate",
  "fecha_caducidad": "expirationDate",
  "vencimiento": "expirationDate",
  "fecha_vencimiento": "expirationDate",
  // English
  "name": "name",
  "product": "name",
  "quantity": "quantity",
  "unit": "unit",
  "expiration": "expirationDate",
  "expiration_date": "expirationDate",
  "expiry": "expirationDate",
  "expiry_date": "expirationDate",
};

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  expirationDate: Date | null;
  selected: boolean;
  error: string | null;
}

type ImportMode = "add" | "replace";
type ViewMode = "cards" | "list";

interface BulkUploadButtonProps {
  onAddMultiple: (items: Omit<PantryItem, "id" | "addedAt" | "pantryId">[]) => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

function normalizeColumnName(col: string): string {
  const normalized = col.toLowerCase().trim().replace(/\s+/g, "_");
  return COLUMN_MAPPINGS[normalized] || normalized;
}

function normalizeUnit(unit: string): string | null {
  const normalized = unit.toLowerCase().trim();
  if (VALID_UNITS.includes(normalized)) {
    return normalized;
  }
  if (UNIT_NORMALIZATIONS[normalized]) {
    return UNIT_NORMALIZATIONS[normalized];
  }
  return null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // Handle Excel serial date numbers
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD/MM/YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const date = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function parseRow(row: Record<string, unknown>): ParsedItem {
  const normalizedRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalizedRow[normalizeColumnName(key)] = value;
  }

  const errors: string[] = [];

  const name = normalizedRow.name ? String(normalizedRow.name).trim() : "";
  if (!name) {
    errors.push("Nombre requerido");
  }

  let quantity = 1;
  if (normalizedRow.quantity !== undefined && normalizedRow.quantity !== "") {
    const parsed = parseFloat(String(normalizedRow.quantity));
    if (isNaN(parsed) || parsed <= 0) {
      errors.push("Cantidad invalida");
    } else {
      quantity = parsed;
    }
  }

  let unit = "unidades";
  if (normalizedRow.unit !== undefined && normalizedRow.unit !== "") {
    const normalized = normalizeUnit(String(normalizedRow.unit));
    if (!normalized) {
      errors.push(`Unidad invalida: ${normalizedRow.unit}`);
    } else {
      unit = normalized;
    }
  }

  const expirationDate = parseDate(normalizedRow.expirationDate);

  return {
    name,
    quantity,
    unit,
    expirationDate,
    selected: errors.length === 0,
    error: errors.length > 0 ? errors.join(", ") : null,
  };
}

function generateTemplateCsv(): string {
  const headers = ["nombre", "cantidad", "unidad", "caducidad"];
  const exampleRows = [
    ["Leche", "2", "L", "2025-01-15"],
    ["Arroz", "1", "kg", ""],
    ["Tomates", "6", "unidades", "2025-01-10"],
    ["Aceite de oliva", "1", "botellas", "2025-06-30"],
  ];
  return [headers.join(","), ...exampleRows.map((row) => row.join(","))].join("\n");
}

export function BulkUploadButton({ onAddMultiple, onDeleteAll }: BulkUploadButtonProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("add");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", unit: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validItems = parsedItems.filter((item) => !item.error);
  const errorItems = parsedItems.filter((item) => item.error);
  const selectedCount = parsedItems.filter((item) => item.selected && !item.error).length;
  const allValidSelected = validItems.length > 0 && validItems.every((item) => item.selected);

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_despensa.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const processFile = useCallback(async (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        variant: "destructive",
        title: "Formato no soportado",
        description: "Solo se aceptan archivos CSV o Excel (.csv, .xlsx, .xls)",
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "Archivo vacio",
          description: "El archivo no contiene datos",
        });
        return;
      }

      const items = rows.map(parseRow);
      setParsedItems(items);
      setShowInstructions(false);
      setShowPreview(true);

      const validCount = items.filter((i) => !i.error).length;
      const errorCount = items.filter((i) => i.error).length;

      toast({
        title: "Archivo procesado",
        description: `${validCount} productos validos${errorCount > 0 ? `, ${errorCount} con errores` : ""}`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: "No se pudo leer el archivo",
      });
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const toggleItem = (index: number) => {
    if (editingIndex !== null) return;
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index && !item.error ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAll = () => {
    if (editingIndex !== null) return;
    const newSelected = !allValidSelected;
    setParsedItems((prev) =>
      prev.map((item) =>
        item.error ? item : { ...item, selected: newSelected }
      )
    );
  };

  const startEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = parsedItems[index];
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
    });
    setEditingIndex(index);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(null);
    setEditForm({ name: "", quantity: "", unit: "" });
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingIndex === null) return;

    const quantity = parseFloat(editForm.quantity);
    if (!editForm.name.trim() || isNaN(quantity) || quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nombre y cantidad son requeridos",
      });
      return;
    }

    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === editingIndex
          ? {
              ...item,
              name: editForm.name.trim(),
              quantity,
              unit: editForm.unit,
              error: null,
              selected: true,
            }
          : item
      )
    );
    setEditingIndex(null);
    setEditForm({ name: "", quantity: "", unit: "" });
  };

  const deleteItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const selectedItems = parsedItems
      .filter((item) => item.selected && !item.error)
      .map(({ name, quantity, unit, expirationDate }) => ({
        name,
        quantity,
        unit,
        expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      }));

    if (selectedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona al menos un producto",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (importMode === "replace") {
        await onDeleteAll();
      }
      await onAddMultiple(selectedItems);
      setShowPreview(false);
      setParsedItems([]);
      setImportMode("add");
      toast({
        title: importMode === "replace" ? "Inventario reemplazado" : "Productos agregados",
        description: `${selectedItems.length} productos ${importMode === "replace" ? "importados" : "agregados"} a tu despensa`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron agregar los productos",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAnother = () => {
    setParsedItems([]);
    setShowPreview(false);
    setShowInstructions(true);
    setEditingIndex(null);
  };

  const handleClosePreview = (open: boolean) => {
    if (!open) {
      setEditingIndex(null);
    }
    setShowPreview(open);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowInstructions(true)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Importar CSV/Excel
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar productos</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV o Excel con tus productos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Formato requerido:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>nombre</strong> - Nombre del producto (requerido)</p>
                <p><strong>cantidad</strong> - Cantidad numerica (requerido)</p>
                <p><strong>unidad</strong> - unidades, kg, g, L, ml, paquetes, latas, botellas</p>
                <p><strong>caducidad</strong> - Fecha YYYY-MM-DD o DD/MM/YYYY (opcional)</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Descargar plantilla
            </Button>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Arrastra un archivo aqui o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, XLSX o XLS
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstructions(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={handleClosePreview}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
            <DialogDescription>
              {validItems.length} validos | {errorItems.length} errores | {selectedCount} seleccionados
            </DialogDescription>
          </DialogHeader>

          {errorItems.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorItems.length} producto{errorItems.length > 1 ? "s" : ""} con errores no se pueden agregar
              </AlertDescription>
            </Alert>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Modo:</span>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Agregar a existentes</SelectItem>
                  <SelectItem value="replace">Reemplazar todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {importMode === "replace" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se eliminaran todos los productos actuales antes de importar
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {validItems.length > 0 && (
              <div
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer border-b"
                onClick={toggleAll}
              >
                <Checkbox checked={allValidSelected} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">Seleccionar todos</span>
              </div>
            )}

            <div className={`max-h-[300px] overflow-y-auto ${viewMode === "cards" ? "space-y-2" : "divide-y"}`}>
              {parsedItems.map((item, index) => (
                viewMode === "cards" ? (
                  // Card view
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      item.error
                        ? "bg-destructive/10 border-destructive/50 cursor-not-allowed"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => !item.error && toggleItem(index)}
                  >
                    <Checkbox
                      checked={item.selected && !item.error}
                      disabled={!!item.error}
                      onCheckedChange={() => toggleItem(index)}
                    />
                    {editingIndex === index ? (
                      <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Nombre"
                          className="h-8 flex-1"
                        />
                        <Input
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                          placeholder="Cant."
                          type="number"
                          className="h-8 w-20"
                        />
                        <Select value={editForm.unit} onValueChange={(v) => setEditForm({ ...editForm, unit: v })}>
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${item.error ? "text-destructive" : ""}`}>
                            {item.name || "(sin nombre)"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit}
                            {item.expirationDate && (
                              <span> - Caduca: {item.expirationDate.toLocaleDateString()}</span>
                            )}
                          </p>
                          {item.error && (
                            <p className="text-xs text-destructive mt-1">{item.error}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => startEdit(index, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => deleteItem(index, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // List view
                  <div
                    key={index}
                    className={`flex items-center gap-3 py-2 px-1 cursor-pointer ${
                      item.error
                        ? "bg-destructive/10 cursor-not-allowed"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => !item.error && toggleItem(index)}
                  >
                    <Checkbox
                      checked={item.selected && !item.error}
                      disabled={!!item.error}
                      onCheckedChange={() => toggleItem(index)}
                    />
                    {editingIndex === index ? (
                      <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Nombre"
                          className="h-7 flex-1 text-sm"
                        />
                        <Input
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                          placeholder="Cant."
                          type="number"
                          className="h-7 w-16 text-sm"
                        />
                        <Select value={editForm.unit} onValueChange={(v) => setEditForm({ ...editForm, unit: v })}>
                          <SelectTrigger className="h-7 w-20 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALID_UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <span className={`font-medium truncate ${item.error ? "text-destructive" : ""}`}>
                            {item.name || "(sin nombre)"}
                          </span>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {item.quantity} {item.unit}
                          </span>
                          {item.expirationDate && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.expirationDate.toLocaleDateString()}
                            </span>
                          )}
                          {item.error && (
                            <span className="text-xs text-destructive truncate">{item.error}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => startEdit(index, e)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => deleteItem(index, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleUploadAnother} disabled={isSaving}>
              Subir otro
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedCount === 0}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                `${importMode === "replace" ? "Reemplazar con" : "Agregar"} ${selectedCount} producto${selectedCount !== 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
