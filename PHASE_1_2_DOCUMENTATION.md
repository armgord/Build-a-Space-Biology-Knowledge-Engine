# 🎤 AudioWaiter Implementation Documentation

## Phase 1 & Phase 2 Complete Technical Guide

> **Project**: React Restaurant Ordering System - Voice-Only Implementation  
> **Technology Stack**: React + TypeScript + Gemini Multimodal Live API + Function Calling  
> **Completion Date**: August 21, 2025  
> **Status**: ✅ Phase 1 & Phase 2 Complete

---

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Phase 1: Component Architecture](#phase-1-component-architecture)
3. [Phase 2: Gemini Function Calling Integration](#phase-2-gemini-function-calling-integration)
4. [Technical Implementation Details](#technical-implementation-details)
5. [Workflow Analysis](#workflow-analysis)
6. [Code Architecture](#code-architecture)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Performance & Optimization](#performance--optimization)

---

## 🎯 **Project Overview**

### **Objective**

Transform a text-based restaurant ordering system into a fully voice-controlled drive-thru experience using Gemini's Multimodal Live API with Function Calling capabilities.

### **Key Transition**

- **FROM**: TextWaiter component that generated ORDER_JSON text blocks
- **TO**: AudioWaiter component that uses function calls to process orders

### **Core Requirements**

- 🎤 **Voice-Only Interface**: No text input, pure audio interaction
- 🍔 **Spanish Menu Processing**: Handle restaurant orders in Spanish
- 📋 **Structured JSON Output**: Generate downloadable order files
- 🔄 **Real-time Processing**: Instant voice-to-order conversion
- 🎯 **Function Calling**: Use Gemini's structured function calls instead of text generation

---

## 🏗️ **Phase 1: Component Architecture**

### **1.1 Component Creation Strategy**

**Goal**: Create AudioWaiter component structure that mirrors TextWaiter functionality but for voice input.

**Key Decisions**:

- ✅ **Reuse Existing Logic**: Extract utilities from TextWaiter for menu processing
- ✅ **Maintain Interface Compatibility**: Same props structure for easy integration
- ✅ **Component Isolation**: Self-contained audio processing logic

### **1.2 File Structure Created**

```
src/components/audio-waiter/
├── AudioWaiter.tsx           # Main component (290+ lines)
├── audioWaiterUtils.ts       # Extracted utilities
├── audio-waiter.scss        # Component styles
└── index.ts                 # Clean exports
```

### **1.3 Component Props Interface**

```typescript
export type AudioWaiterProps = {
  menu: any; // menu.json structure
  handleOrder: (order: OrderJSON) => void; // required: called with validated order
};
```

**Design Philosophy**:

- **Minimal Props**: Only essential data needed
- **Callback Pattern**: Parent handles order processing
- **Type Safety**: Full TypeScript integration

### **1.4 Core Data Types**

```typescript
export type Producto = {
  nombre: string; // Menu item name
  cantidad: number; // Quantity ordered
  precio: number; // Price per item
  modificadores?: string[]; // Optional modifications
};

export type OrderJSON = {
  timestamp: string; // ISO timestamp
  productos: Producto[]; // Array of ordered items
  total: number; // Total order amount
  resumen: string; // Order summary in Spanish
};
```

### **1.5 Utility Function Extraction**

**From TextWaiter to audioWaiterUtils.ts**:

```typescript
// Menu processing functions
export function findMenuItem(itemName: string, menuItems: any[]): any;
export function canonicalizeOrder(rawOrder: any, menuItems: any[]): OrderJSON;
export function downloadOrderJSON(order: OrderJSON): void;
export function flattenMenuItems(menu: any): any[];
export function normalize(s?: string): string;
export function levenshtein(a: string, b: string): number;
```

**Rationale**:

- 🔄 **Code Reuse**: Avoid duplication between TextWaiter and AudioWaiter
- 🧪 **Testability**: Isolated functions are easier to test
- 📦 **Modularity**: Clean separation of concerns

---

## 🔧 **Phase 2: Gemini Function Calling Integration**

### **2.1 Function Calling Paradigm Shift**

**Old Approach (TextWaiter)**:

```
Voice Input → AI → Generate ORDER_JSON Text → Parse Text → Process Order
```

**New Approach (AudioWaiter)**:

```
Voice Input → AI → Call process_order() Function → Direct Processing
```

### **2.2 Function Declaration Design**

**Complete Function Schema**:

```typescript
const orderFunctionDeclaration = {
  name: "process_order",
  description:
    "Processes a restaurant drive-thru order with menu items in Spanish",
  parameters: {
    type: "object",
    properties: {
      productos: {
        type: "array",
        description: "List of ordered menu items",
        items: {
          type: "object",
          properties: {
            nombre: {
              type: "string",
              description: "Name of the menu item as spoken by customer",
            },
            cantidad: {
              type: "number",
              description: "Quantity ordered (must be positive integer)",
            },
            precio: {
              type: "number",
              description:
                "Estimated price per item (will be corrected by system)",
            },
            modificadores: {
              type: "array",
              items: { type: "string" },
              description:
                'Optional modifications like "sin cebolla", "extra queso"',
            },
          },
          required: ["nombre", "cantidad", "precio"],
        },
      },
      total: {
        type: "number",
        description: "Total estimated order amount (will be recalculated)",
      },
      resumen: {
        type: "string",
        description: "Brief order summary in Spanish (max 150 characters)",
      },
    },
    required: ["productos", "total", "resumen"],
  },
};
```

**Design Principles**:

- 🎯 **Precise Schema**: Exact parameter types and descriptions
- 🔄 **Error Tolerance**: Allow estimated prices (corrected later)
- 🌐 **Localization**: Spanish-specific descriptions and examples
- ✅ **Validation**: Required fields clearly defined

### **2.3 LiveAPI Configuration Integration**

**Step-by-Step Process**:

1. **Tool Creation**:

```typescript
const orderTool: Tool = {
  functionDeclarations: [orderFunctionDeclaration as any],
};
```

2. **Configuration Update**:

```typescript
const updatedConfig = {
  ...config,
  tools: [...(config.tools || []), orderTool],
};
setConfig(updatedConfig);
```

3. **Duplicate Prevention**:

```typescript
const hasOrderTool = config.tools?.some(
  (tool) =>
    "functionDeclarations" in tool &&
    tool.functionDeclarations?.some((fn) => fn.name === "process_order")
);
```

### **2.4 Event Handling Architecture**

**Three Main Event Types**:

#### **A) Tool Call Events** (`toolcall`)

```typescript
const handleToolCall = (toolCall: any) => {
  if (toolCall.functionCalls && Array.isArray(toolCall.functionCalls)) {
    toolCall.functionCalls.forEach((functionCall: any) => {
      if (functionCall.name === "process_order") {
        processOrder(functionCall.args); // 🎯 This triggers order processing!
      }
    });
  }
};
```

#### **B) Content Events** (`content`)

````typescript
const handleContent = (content: any) => {
  // Handle regular text responses
  // Detect ORDER_JSON fallback behavior (error case)
  if (textContent.includes("ORDER_JSON") || textContent.includes("```")) {
    console.warn("⚠️ AI generated ORDER_JSON text instead of using function!");
    setStatus("⚠️ AI used old method - please reconnect and try again");
  }
};
````

#### **C) Connection Events** (`close`)

```typescript
const handleClose = () => {
  setStatus("Connection closed");
};
```

### **2.5 Critical Bug Resolution**

**Problem Identified**:

- AI was generating ORDER_JSON text blocks instead of using function calls
- Mixed system instructions caused confusion between text and function approaches

**Root Cause**:

```typescript
// OLD SYSTEM INSTRUCTION (Problem)
"Cuando termines de procesar el pedido, genera un bloque ORDER_JSON:";

// NEW SYSTEM INSTRUCTION (Solution)
"ÚNICAMENTE cuando el cliente diga 'sí', 'confirmo', etc. después de '¿Confirmas este pedido?', **USA LA FUNCIÓN process_order**";
```

**Resolution Steps**:

1. ✅ Updated SettingsDialog.tsx system instructions
2. ✅ Added ORDER_JSON text detection in content handler
3. ✅ Enhanced debugging for function call structure
4. ✅ Fixed function call parsing (functionCalls array vs direct name property)

---

## 🔄 **Technical Implementation Details**

### **3.1 Complete Component Lifecycle**

#### **Initialization Phase**:

```typescript
useEffect(() => {
  // 1. Flatten menu items for faster searching
  if (!menu || menuItemsRef.current) return;
  menuItemsRef.current = flattenMenuItems(menu);
}, [menu]);

useEffect(() => {
  // 2. Configure LiveAPI with function declarations
  const orderTool: Tool = { functionDeclarations: [orderFunctionDeclaration] };
  if (!hasOrderTool)
    setConfig({ ...config, tools: [...(config.tools || []), orderTool] });
}, [orderFunctionDeclaration, config, setConfig]);

useEffect(() => {
  // 3. Set up event listeners
  client.on("toolcall", handleToolCall);
  client.on("content", handleContent);
  client.on("close", handleClose);
  return () => {
    /* cleanup listeners */
  };
}, [client, connected]);
```

#### **Processing Phase**:

```typescript
const processOrder = useCallback(
  async (rawOrderData: any) => {
    try {
      setIsProcessing(true);
      setStatus("Processing your order...");

      // Canonicalize the order (fix names, prices, etc.)
      const canonicalOrder = canonicalizeOrder(
        rawOrderData,
        menuItemsRef.current || []
      );

      // Call parent handler
      handleOrder(canonicalOrder);

      // Download JSON file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadOrderJSON(canonicalOrder, `order-${timestamp}.json`);

      setStatus("✅ Order processed successfully!");
    } catch (error) {
      console.error("Error processing order:", error);
      setStatus("❌ Error processing order");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus("Waiting for voice input..."), 3000);
    }
  },
  [handleOrder]
);
```

### **3.2 Menu Processing Algorithm**

#### **Fuzzy Matching Implementation**:

```typescript
export function findMenuItem(nameOrCode: string, menuItems: any[]) {
  const n = normalize(nameOrCode);
  if (!n) return null;

  // 1. Exact code match (highest priority)
  const codeMatch = menuItems.find((it) => normalize(String(it.codigo)) === n);
  if (codeMatch) return codeMatch;

  // 2. Exact name match
  const exactName = menuItems.find((it) => normalize(it.nombre) === n);
  if (exactName) return exactName;

  // 3. Partial name match (contains)
  const contains = menuItems.find((it) => normalize(it.nombre).includes(n));
  if (contains) return contains;

  // 4. Fuzzy match using levenshtein distance
  let best = null;
  let bestScore = Infinity;
  for (const it of menuItems) {
    const dist = levenshtein(normalize(it.nombre), n);
    if (dist < bestScore) {
      bestScore = dist;
      best = it;
    }
  }

  // Only return if the match is good enough
  if (best && bestScore <= Math.max(2, Math.floor(n.length * 0.35))) {
    return best;
  }

  return null;
}
```

#### **Price Canonicalization**:

```typescript
export function canonicalizeOrder(rawOrder: any, menuItems: any[]): OrderJSON {
  const productosRaw = Array.isArray(rawOrder.productos)
    ? rawOrder.productos
    : [];

  const productos: Producto[] = productosRaw.map((p: any) => {
    const nombreRaw = String(p.nombre || "");
    const cantidad = Number(p.cantidad || 0) || 0;
    const mods = Array.isArray(p.modificadores)
      ? p.modificadores.map(String)
      : undefined;

    // Try to find the item in the menu
    const found = findMenuItem(nombreRaw, menuItems);

    if (found) {
      // Use menu data (correct name and price)
      return {
        nombre: String(found.nombre),
        cantidad,
        precio: Number(found.precio || 0),
        modificadores: mods,
      };
    } else {
      // Item not found in menu - use original data
      return {
        nombre: nombreRaw,
        cantidad,
        precio: Number(p.precio || 0),
        modificadores: mods,
      };
    }
  });

  // Calculate correct total
  const total = productos.reduce(
    (sum, prod) => sum + prod.precio * prod.cantidad,
    0
  );

  return {
    timestamp: new Date().toISOString(),
    productos,
    total: Math.round(total * 100) / 100, // Round to 2 decimals
    resumen: capResumen(String(rawOrder.resumen || "")),
  };
}
```

### **3.3 File Download Implementation**

```typescript
export function downloadOrderJSON(order: any, filename = "order.json") {
  try {
    const blob = new Blob([JSON.stringify(order, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`📁 Order downloaded: ${filename}`);
  } catch (e) {
    console.error("downloadOrderJSON error:", e);
  }
}
```

---

## 🔍 **Workflow Analysis**

### **4.1 Complete User Journey**

```mermaid
graph TD
    A[User Speaks Order] --> B[Gemini AI Processes Voice]
    B --> C{Is this a food order?}
    C -->|Yes| D[AI asks clarifying questions]
    C -->|No| E[Normal conversation response]
    D --> F[AI summarizes order]
    F --> G[AI asks: "¿Confirmas este pedido?"]
    G --> H[User confirms: "Sí, confirmo"]
    H --> I[AI calls process_order function]
    I --> J[handleToolCall receives function call]
    J --> K[processOrder canonicalizes data]
    K --> L[handleOrder called + JSON downloaded]

    E --> M[handleContent processes text]

    B --> N{AI generates ORDER_JSON text?}
    N -->|Yes| O[handleContent detects error]
    O --> P[User needs to reconnect]
```

### **4.2 Data Flow Diagram**

```
Voice Input: "Quiero una hamburguesa y una coca cola"
    ↓
Gemini Multimodal Live API
    ↓
AI Analysis: "This is a restaurant order → use process_order function"
    ↓
Function Call Detection
    ↓
{
  "functionCalls": [{
    "name": "process_order",
    "args": {
      "productos": [
        {"nombre": "hamburguesa", "cantidad": 1, "precio": 85},
        {"nombre": "coca cola", "cantidad": 1, "precio": 25}
      ],
      "total": 110,
      "resumen": "1 hamburguesa y 1 coca cola"
    }
  }]
}
    ↓
Parameter Validation & Menu Matching
    ↓
Price Canonicalization (using real menu prices)
    ↓
{
  "timestamp": "2025-08-22T01:00:40.318Z",
  "productos": [
    {"nombre": "Hamburguesa de carne sencilla", "cantidad": 1, "precio": 85, "modificadores": []},
    {"nombre": "Coca Cola lata", "cantidad": 1, "precio": 25, "modificadores": []}
  ],
  "total": 110.00,
  "resumen": "1 Hamburguesa de carne sencilla y 1 Coca Cola lata. Total: $110.00"
}
    ↓
handleOrder(canonicalOrder) → App.tsx
    ↓
downloadOrderJSON(canonicalOrder) → Downloads folder
```

### **4.3 Error Handling Flow**

```typescript
// Layer 1: Function Call Structure Validation
if (!toolCall.functionCalls || !Array.isArray(toolCall.functionCalls)) {
  console.warn("Unexpected tool call structure:", toolCall);
  setStatus("❌ Unexpected function call structure");
  return;
}

// Layer 2: Function Name Validation
if (functionCall.name !== "process_order") {
  console.warn("Unknown function called:", functionCall.name);
  setStatus("❌ Unknown function called: " + functionCall.name);
  return;
}

// Layer 3: Parameter Validation
if (!orderData.productos || !Array.isArray(orderData.productos)) {
  throw new Error("No products found in order");
}

if (orderData.productos.length === 0) {
  throw new Error("Order is empty");
}

// Layer 4: Menu Item Validation (in canonicalizeOrder)
const menuItem = findMenuItem(producto.nombre, menuItems);
if (!menuItem) {
  console.warn(`Menu item not found: ${producto.nombre}`);
  // Use original data as fallback
}
```

---

## 🏛️ **Code Architecture**

### **5.1 Component Responsibility Matrix**

| Component               | Responsibility                                          | Dependencies                     | Outputs                     |
| ----------------------- | ------------------------------------------------------- | -------------------------------- | --------------------------- |
| **AudioWaiter.tsx**     | Voice processing, Function calling, Order orchestration | LiveAPIContext, audioWaiterUtils | OrderJSON, Downloaded files |
| **audioWaiterUtils.ts** | Menu processing, Price correction, File download        | None (pure functions)            | Processed order data        |
| **App.tsx**             | Menu loading, Component integration, Order handling     | AudioWaiter, menu.json           | UI coordination             |
| **SettingsDialog.tsx**  | System instructions, AI behavior configuration          | LiveAPIContext                   | Configuration updates       |

### **5.2 State Management Strategy**

```typescript
// Local Component State
const [isProcessing, setIsProcessing] = useState(false);
const [status, setStatus] = useState("Waiting for voice input...");

// Context State (LiveAPI)
const { client, connected, config, setConfig } = useLiveAPIContext();

// Refs for Performance
const menuItemsRef = useRef<any[] | null>(null); // Cached flattened menu

// Memoized Values
const orderFunctionDeclaration = useMemo(() => ({...}), []); // Function schema
```

### **5.3 Hook Usage Pattern**

```typescript
// Effect 1: Menu Preprocessing
useEffect(() => {
  if (menu && !menuItemsRef.current) {
    menuItemsRef.current = flattenMenuItems(menu);
  }
}, [menu]);

// Effect 2: Function Declaration Registration
useEffect(() => {
  // Register process_order function with LiveAPI
  if (!hasOrderTool) {
    const updatedConfig = {
      ...config,
      tools: [...(config.tools || []), orderTool],
    };
    setConfig(updatedConfig);
  }
}, [orderFunctionDeclaration, config, setConfig]);

// Effect 3: Event Listener Setup
useEffect(() => {
  // Set up toolcall, content, and close handlers
  client.on("toolcall", handleToolCall);
  client.on("content", handleContent);
  client.on("close", handleClose);
  return () => {
    client.off("toolcall", handleToolCall);
    client.off("content", handleContent);
    client.off("close", handleClose);
  };
}, [client, connected, processOrder]);
```

### **5.4 TypeScript Integration**

```typescript
// Strict Type Definitions
export type Producto = {
  nombre: string;
  cantidad: number;
  precio: number;
  modificadores?: string[];
};

export type OrderJSON = {
  timestamp: string;
  productos: Producto[];
  total: number;
  resumen: string;
};

// Props Interface
export type AudioWaiterProps = {
  menu: any;
  handleOrder: (order: OrderJSON) => void;
};

// Function Declaration Type
const orderFunctionDeclaration: {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
} = {
  /* ... */
};
```

---

## 🐛 **Debugging & Troubleshooting**

### **6.1 Debugging System Implementation**

#### **Console Logging Strategy**:

```typescript
// Function Declaration Registration
console.log("🔧 Adding order function to LiveAPI configuration");
console.log("Function declaration:", orderFunctionDeclaration);
console.log("✅ Function declaration added to LiveAPI tools");

// Configuration Validation
console.log("🔍 Current LiveAPI config:", config);
console.log(
  "🔍 Available tools:",
  config?.tools?.map((tool) =>
    "functionDeclarations" in tool
      ? tool.functionDeclarations?.map((fn) => fn.name)
      : "No function declarations"
  )
);

// Function Call Processing
console.log("🔧 Tool call received:", JSON.stringify(toolCall, null, 2));
console.log("🔍 Processing function call:", functionCall.name);
console.log(
  "🍔 Order function called with args:",
  JSON.stringify(functionCall.args, null, 2)
);

// Order Processing
console.log("Raw order data received:", rawOrderData);
console.log("Canonical order:", canonicalOrder);
```

#### **Status Indicator System**:

```typescript
// Connection States
"Not connected to Gemini AI";
"🎤 Ready - speak your order in Spanish";

// Processing States
"Processing your order...";
"✅ Order processed successfully!";

// Error States
"❌ Error processing order";
"❌ Unknown function called: [function_name]";
"⚠️ AI used old method - please reconnect and try again";
"❌ Unexpected function call structure";
```

### **6.2 Common Issues & Solutions**

#### **Issue 1: Function Not Called**

**Symptoms**: AI generates ORDER_JSON text instead of calling function
**Diagnosis**: Check system instructions in SettingsDialog.tsx
**Solution**:

```javascript
// Ensure system instruction includes:
"**USA LA FUNCIÓN process_order** con los parámetros correctos";
// NOT:
"genera un bloque ORDER_JSON";
```

#### **Issue 2: Function Called But No Processing**

**Symptoms**: Console shows function call but no download happens
**Diagnosis**: Check handleToolCall structure parsing
**Solution**:

```typescript
// Ensure checking for array structure:
if (toolCall.functionCalls && Array.isArray(toolCall.functionCalls)) {
  // Process each function call
}
```

#### **Issue 3: Menu Items Not Found**

**Symptoms**: All items show "not found in menu"
**Diagnosis**: Check menu flattening and normalization
**Solution**:

```typescript
// Debug menu flattening:
console.log("Menu items flattened:", menuItemsRef.current?.length, "items");
console.log("Sample items:", menuItemsRef.current?.slice(0, 3));
```

#### **Issue 4: Incorrect Prices**

**Symptoms**: Downloaded JSON has wrong prices
**Diagnosis**: Check canonicalizeOrder price mapping
**Solution**:

```typescript
// Ensure using menu prices:
if (found) {
  return {
    nombre: String(found.nombre),
    precio: Number(found.precio || 0), // Use menu price
  };
}
```

### **6.3 Development vs Production Behavior**

```typescript
// Debug info only in development
{
  process.env.NODE_ENV === "development" && (
    <div className="debug-info">
      <small>
        Debug: Menu loaded = {!!menu}, Items ={" "}
        {menuItemsRef.current?.length || 0}
      </small>
    </div>
  );
}
```

---

## ⚡ **Performance & Optimization**

### **7.1 Memory Management**

```typescript
// Efficient menu caching
const menuItemsRef = useRef<any[] | null>(null);

useEffect(() => {
  if (!menu || menuItemsRef.current) return; // Prevent re-flattening
  menuItemsRef.current = flattenMenuItems(menu);
}, [menu]);
```

### **7.2 Event Listener Cleanup**

```typescript
useEffect(() => {
  // Setup listeners
  client.on("toolcall", handleToolCall);
  client.on("content", handleContent);
  client.on("close", handleClose);

  return () => {
    // Critical cleanup to prevent memory leaks
    client.off("toolcall", handleToolCall);
    client.off("content", handleContent);
    client.off("close", handleClose);
  };
}, [client, connected, processOrder]);
```

### **7.3 Memoization Strategy**

```typescript
// Memoize function declaration (expensive object creation)
const orderFunctionDeclaration = useMemo(
  () => ({
    name: "process_order",
    // ... complex object structure
  }),
  []
); // Empty deps - never changes

// Memoize callback with proper dependencies
const processOrder = useCallback(
  (rawOrderData: any) => {
    // Processing logic
  },
  [handleOrder] // Only re-create when handleOrder changes
);
```

### **7.4 Render Optimization**

```typescript
// Conditional rendering to avoid unnecessary updates
{
  isProcessing && (
    <div className="processing-indicator">
      <div className="pulse-dot"></div>
      Processing your order...
    </div>
  );
}

{
  connected && (
    <div className="function-status">
      ✅ Function calling enabled - ready to process orders!
    </div>
  );
}
```

---

## 🎉 **Conclusion**

The AudioWaiter implementation successfully demonstrates:

- ✅ **Voice-First Design**: Complete audio interaction without text input
- ✅ **Function Calling Integration**: Structured data processing via Gemini API
- ✅ **Menu Validation**: Intelligent item matching and price correction
- ✅ **Error Handling**: Comprehensive debugging and fallback mechanisms
- ✅ **Performance**: Optimized rendering and memory management
- ✅ **Type Safety**: Full TypeScript integration throughout

The system provides a production-ready foundation for voice-controlled restaurant ordering systems with automatic JSON generation and download capabilities.

**Next Steps**: Integration with payment systems, order management backends, and multi-language support could further enhance the system's capabilities.
