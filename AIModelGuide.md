
## claude (1)


```mermaid

graph TD
    %% Title Section
    TITLE["🤖 AI MODEL SELECTION GUIDE<br/>Choose the right model for your project"]
    
    %% Input Types Section
    subgraph InputSection ["📊 INPUT DATA TYPES"]
        direction TB
        subgraph Row1 [" "]
            TAB["Tabular<br/>Structured data<br/>CSV, databases"]
            TXT["Text<br/>Documents, NLP<br/>Articles, reviews"]
            IMG["Images<br/>Photos, medical<br/>Satellite, art"]
        end
        subgraph Row2 [" "]
            SEQ["Sequential<br/>Time-ordered<br/>Sensors, logs"]
            AUD["Audio<br/>Speech, music<br/>Sounds, calls"]
            VID["Video<br/>Motion, streams<br/>Surveillance"]
        end
        subgraph Row3 [" "]
            TS["Time Series<br/>Temporal patterns<br/>Finance, IoT"]
            GRAPH["Graph/Network<br/>Connected data<br/>Social, molecular"]
        end
    end
    
    %% Models Section - Organized by complexity
    subgraph ModelSection ["🧠 AI MODELS BY COMPLEXITY"]
        direction TB
        
        subgraph Classical ["🔧 CLASSICAL ML - Fast, Explainable, Small Data"]
            direction LR
            LR["Linear Models<br/>Regression<br/>Logistic"]
            RF["Tree Methods<br/>Random Forest<br/>XGBoost"]
            SVM["SVM<br/>Support Vector<br/>Machines"]
            KNN["Instance-Based<br/>K-Nearest<br/>Neighbors"]
        end
        
        subgraph DeepBasic ["🧠 BASIC DEEP LEARNING - Medium Data, Good Performance"]
            direction LR
            MLP["MLP<br/>Multi-Layer<br/>Perceptron"]
            CNN["CNN<br/>Convolutional<br/>Networks"]
            RNN["RNN<br/>Recurrent<br/>Networks"]
        end
        
        subgraph DeepAdvanced ["⚡ ADVANCED DEEP LEARNING - Large Data, SOTA Performance"]
            direction LR
            TRANS["Transformers<br/>Attention-based<br/>BERT, GPT"]
            GAN["Generative<br/>GANs, VAEs<br/>Diffusion"]
            SPEC["Specialized<br/>YOLO, U-Net<br/>Graph NNs"]
        end
    end
    
    %% Output Types Section
    subgraph OutputSection ["🎯 OUTPUT TYPES & TASKS"]
        direction TB
        subgraph OutRow1 [" "]
            CLS["Classification<br/>Categories<br/>Discrete labels"]
            REG["Regression<br/>Continuous values<br/>Predictions"]
            GEN["Generation<br/>Create new content<br/>Text, images"]
        end
        subgraph OutRow2 [" "]
            DET["Detection<br/>Object location<br/>Segmentation"]
            REC["Recommendation<br/>Personalization<br/>Ranking"]
            EMB["Embeddings<br/>Feature extraction<br/>Similarity"]
        end
    end
    
    %% Decision Criteria Section
    subgraph CriteriaSection ["📋 SELECTION CRITERIA"]
        direction TB
        subgraph DataCriteria ["Data Considerations"]
            direction LR
            SMALL["< 10K samples<br/>→ Classical ML"]
            MED["10K - 1M samples<br/>→ Basic Deep Learning"]
            LARGE["> 1M samples<br/>→ Advanced Deep Learning"]
        end
        subgraph PerfCriteria ["Performance Requirements"]
            direction LR
            REALTIME["Real-time < 10ms<br/>→ Linear, Trees"]
            FAST["Fast < 100ms<br/>→ XGBoost, CNN"]
            BATCH["Batch Processing<br/>→ Any model"]
        end
        subgraph ExplainCriteria ["Explainability Needs"]
            direction LR
            HIGH["High Explainability<br/>→ Classical ML"]
            LOW["Black Box OK<br/>→ Deep Learning"]
        end
    end
    
    %% Recommendation Matrix
    subgraph RecommendationSection ["💡 QUICK RECOMMENDATIONS"]
        direction TB
        subgraph QuickRecs [" "]
            REC1["Tabular + Classification + Explainable<br/>→ Random Forest, XGBoost"]
            REC2["Text + Generation + Large Data<br/>→ GPT, Transformers"]
            REC3["Images + Detection + Real-time<br/>→ Efficient CNN, YOLO"]
            REC4["Time Series + Prediction + Fast<br/>→ XGBoost, LSTM"]
            REC5["Small Dataset + Any Task<br/>→ Classical ML First"]
        end
    end
    
    %% Connections - Key pathways
    TITLE --> InputSection
    InputSection --> ModelSection
    ModelSection --> OutputSection
    OutputSection --> CriteriaSection
    CriteriaSection --> RecommendationSection
    
    %% Styling for portrait poster
    classDef titleStyle fill:#1a237e,color:#ffffff,stroke:#000051,stroke-width:3px
    classDef sectionStyle fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef inputStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef classicalStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef deepBasicStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef deepAdvStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef outputStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef criteriaStyle fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef recStyle fill:#fff8e1,stroke:#ffa000,stroke-width:2px
    
    class TITLE titleStyle
    class TAB,TXT,IMG,SEQ,AUD,VID,TS,GRAPH inputStyle
    class LR,RF,SVM,KNN classicalStyle
    class MLP,CNN,RNN deepBasicStyle
    class TRANS,GAN,SPEC deepAdvStyle
    class CLS,REG,GEN,DET,REC,EMB outputStyle
    class SMALL,MED,LARGE,REALTIME,FAST,BATCH,HIGH,LOW criteriaStyle
    class REC1,REC2,REC3,REC4,REC5 recStyle
```

## claude 2 (more compact)

```mermaid

graph TD
    %% Title
    TITLE["🤖 AI MODEL SELECTION GUIDE"]
    
    %% Input Types - More compact
    subgraph Inputs ["📊 INPUT TYPES"]
        TAB["Tabular Data"]
        TXT["Text"]
        IMG["Images"]
        SEQ["Sequential"]
        AUD["Audio"]
        VID["Video"]
        TS["Time Series"]
        NET["Networks"]
    end
    
    %% Models organized in columns
    subgraph Models ["🧠 MODEL TYPES"]
        subgraph Classical ["Classical ML"]
            LR["Linear Reg"]
            RF["Random Forest"]
            XGB["XGBoost"]
            SVM["SVM"]
        end
        
        subgraph Deep ["Deep Learning"]
            MLP["MLP"]
            CNN["CNN"]
            RNN["RNN/LSTM"]
            TRANS["Transformers"]
        end
        
        subgraph Advanced ["Specialized"]
            BERT["BERT/GPT"]
            YOLO["YOLO/RCNN"]
            GAN["GAN/VAE"]
            GNN["Graph NN"]
        end
    end
    
    %% Outputs - simplified
    subgraph Outputs ["🎯 OUTPUT TASKS"]
        CLS["Classification"]
        REG["Regression"]
        GEN["Generation"]
        DET["Detection"]
        REC["Recommendation"]
        EMB["Embeddings"]
    end
    
    %% Decision factors
    subgraph Factors ["📋 KEY FACTORS"]
        subgraph Data ["Data Size"]
            SMALL["< 10K → Classical"]
            LARGE["> 1M → Deep/Advanced"]
        end
        
        subgraph Speed ["Speed Need"]
            FAST["Real-time → Simple"]
            SLOW["Batch → Complex"]
        end
        
        subgraph Explain ["Interpretability"]
            INTERP["Need → Classical"]
            BLACKBOX["OK → Deep"]
        end
    end
    
    %% Quick recommendations
    subgraph Quick ["💡 COMMON CHOICES"]
        Q1["Tabular → XGBoost/RF"]
        Q2["Text → BERT/GPT"]
        Q3["Images → CNN/YOLO"]
        Q4["Time Series → LSTM/XGB"]
        Q5["Small Data → Classical"]
        Q6["Need Speed → Linear/Trees"]
    end
    
    %% Main flow connections
    TITLE --> Inputs
    Inputs --> Models  
    Models --> Outputs
    Outputs --> Factors
    Factors --> Quick
    
    %% Key input-model connections (most important ones only)
    TAB --> XGB
    TAB --> RF
    TXT --> BERT
    TXT --> TRANS
    IMG --> CNN
    IMG --> YOLO
    TS --> RNN
    NET --> GNN
    
    %% Styling - more compact
    classDef title fill:#1565c0,color:white,stroke:#0d47a1,stroke-width:2px
    classDef input fill:#81c784,stroke:#388e3c,stroke-width:1px
    classDef classical fill:#ffb74d,stroke:#f57c00,stroke-width:1px
    classDef deep fill:#f06292,stroke:#c2185b,stroke-width:1px
    classDef advanced fill:#ba68c8,stroke:#7b1fa2,stroke-width:1px
    classDef output fill:#64b5f6,stroke:#1976d2,stroke-width:1px
    classDef factor fill:#a5d6a7,stroke:#4caf50,stroke-width:1px
    classDef quick fill:#fff176,stroke:#fbc02d,stroke-width:1px
    
    class TITLE title
    class TAB,TXT,IMG,SEQ,AUD,VID,TS,NET input
    class LR,RF,XGB,SVM classical
    class MLP,CNN,RNN,TRANS deep
    class BERT,YOLO,GAN,GNN advanced
    class CLS,REG,GEN,DET,REC,EMB output
    class SMALL,LARGE,FAST,SLOW,INTERP,BLACKBOX factor
    class Q1,Q2,Q3,Q4,Q5,Q6 quick
```

### Gemini

