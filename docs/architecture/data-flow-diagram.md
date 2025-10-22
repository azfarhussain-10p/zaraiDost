# Data Flow Diagram
```mermaid
graph TD
    A[User Input (Voice/Image/Text)] --> B[Frontend]
    B --> C[Offline Processing (TensorFlow Lite/SQLite)]
    B --> D[API Gateway (GraphQL)]
    D --> E[AI Wrapper]
    E --> F[Base Models (GPT/IBM API)]
    E --> G[Orchestration]
    F --> H[Post-Processing]
    G --> H
    H --> I[Output (Voice/SMS)]
    J[Weekly Sync] <--> B
    K[Monitoring] --> All
```

- Input: Routes to offline if no net.
- Processing: Wrapper handles calls; pre-processes data.
- Output: Localized responses.
