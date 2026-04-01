import unittest
from unittest.mock import MagicMock, patch
import json
import pandas as pd
import os
import sys

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from services.auth_service import create_user, authenticate_user, update_user_approval
from utils.preprocessing import preprocess
from services.alert_service import check_and_send_alerts

class TestIntegratedLogic(unittest.TestCase):

    @patch('services.auth_service.SessionLocal')
    @patch('services.auth_service.bcrypt')
    def test_auth_workflow(self, mock_bcrypt, mock_session):
        # Mocking DB
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        mock_bcrypt.hashpw.return_value = b"hashed"
        mock_bcrypt.checkpw.return_value = True

        # 1. Register
        create_user("testuser", "password", email="test@example.com", name="Test User")
        self.assertTrue(mock_db.add.called)
        
        # 2. Login (should fail if not approved)
        mock_user = MagicMock()
        mock_user.approved = False
        mock_user.password = "hashed"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        user = authenticate_user("testuser", "password")
        self.assertIsNone(user)

        # 3. Approve
        update_user_approval("testuser", True)
        self.assertTrue(mock_db.commit.called)

        # 4. Login (should succeed)
        mock_user.approved = True
        user = authenticate_user("testuser", "password")
        self.assertIsNotNone(user)

    def test_advanced_preprocessing(self):
        data = {
            "Glucose_gL": [10.0, 8.0, 5.0],
            "Dissolved_Oxygen_percent": [100, 95, 90],
            "Product_Titer_gL": [0.5, 1.2, 2.5],
            "Cell_Viability_percent": [99, 98, 97],
            "Agitation_RPM": [100, 110, 105]
        }
        df = pd.DataFrame(data)
        processed_df = preprocess(df)
        
        self.assertIn("Glucose_Consumption_Rate", processed_df.columns)
        self.assertIn("DO_Change", processed_df.columns)
        self.assertIn("Specific_Productivity", processed_df.columns)
        self.assertIn("High_Titer_Flag", processed_df.columns)
        self.assertEqual(processed_df["High_Titer_Flag"].iloc[-1], 1)

    @patch('services.alert_service.get_alert_config')
    @patch('services.alert_service.send_email_alert')
    def test_alert_triggering(self, mock_send_email, mock_get_config):
        # Mock alert config
        mock_config = MagicMock()
        mock_config.email_enabled = True
        mock_config.condition = "above"
        mock_config.titer_threshold = 2.0
        mock_config.target_email = "admin@example.com"
        mock_get_config.return_value = mock_config

        results = {
            "predictions": [1.0, 2.5],
            "model_name": "TestModel"
        }

        check_and_send_alerts("testuser", results)
        
        # Should have triggered email because 2.5 > 2.0
        self.assertTrue(mock_send_email.called)
        args, _ = mock_send_email.call_args
        self.assertEqual(args[0], "admin@example.com")
        self.assertIn("Above", args[1])

if __name__ == '__main__':
    unittest.main()
