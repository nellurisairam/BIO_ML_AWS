from services.ml_service import get_model_and_schema
from utils.preprocessing import preprocess, align_columns
from db.database import logger

def run_prediction(df, model_name="model_ridgecv.joblib", schema_name="feature_schema.json"):
    try:
        model, schema = get_model_and_schema(model_name, schema_name)
        df = preprocess(df)
        X, _ = align_columns(df, schema)
        preds = model.predict(X)
        import numpy as np
        
        # Calculate correlation for numerical columns
        numeric_df = df.select_dtypes(include=[np.number])
        corr_matrix = numeric_df.corr().to_dict() if not numeric_df.empty else {}
        
        # Calculate Evaluation Metrics if ground truth 'Product_Titer_gL' exists
        metrics = None
        if 'Product_Titer_gL' in df.columns:
            from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
            y_true = df['Product_Titer_gL']
            metrics = {
                "r2": r2_score(y_true, preds),
                "rmse": float(np.sqrt(mean_squared_error(y_true, preds))),
                "mae": mean_absolute_error(y_true, preds)
            }
        
        # Attempt to get feature importances if it's a pipeline/tree model
        feature_importances = None
        try:
            model_step = model.named_steps.get('model') or model.steps[-1][1]
            if hasattr(model_step, 'feature_importances_'):
                importances = model_step.feature_importances_.tolist()
                feature_importances = dict(zip(X.columns, importances))
            elif hasattr(model_step, 'coef_'):
                coefs = model_step.coef_.tolist()
                if isinstance(coefs[0], list): coefs = coefs[0]
                feature_importances = dict(zip(X.columns, coefs))
        except Exception:
            pass

        logger.info(f"Prediction successful for {len(preds)} rows.")
        return {
            "results": preds.tolist(),
            "count": len(preds),
            "inputs": df.to_dict(orient="list"),
            "correlations": corr_matrix,
            "feature_importances": feature_importances,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise e
