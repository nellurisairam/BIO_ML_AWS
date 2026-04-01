import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the 'app' directory to sys.path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

class TestBackendLogic(unittest.TestCase):

    @patch('services.ml_service.download_file')
    @patch('services.ml_service.joblib.load')
    @patch('services.ml_service.json.load')
    @patch('services.ml_service.open', create=True)
    def test_ml_service_loading(self, mock_open, mock_json_load, mock_joblib_load, mock_download):
        from services.ml_service import get_model_and_schema
        
        # Mock joblib and json
        mock_joblib_load.return_value = "model_obj"
        mock_json_load.return_value = {"features": ["A", "B"]}
        
        model, schema = get_model_and_schema()
        
        self.assertEqual(model, "model_obj")
        self.assertEqual(schema["features"], ["A", "B"])
        mock_download.assert_called()

    @patch('db.database.SessionLocal')
    @patch('bcrypt.hashpw')
    @patch('bcrypt.checkpw')
    def test_auth_service(self, mock_checkpw, mock_hashpw, mock_session):
        from services.auth_service import create_user, authenticate_user
        from db.models import User
        
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        
        # Test create_user
        mock_hashpw.return_value = b"hashed"
        create_user("test", "pass")
        mock_db.add.assert_called()
        mock_db.commit.assert_called()
        mock_db.close.assert_called()
        
        # Test authenticate_user
        user_obj = User(username="test", password="hashed")
        mock_db.query.return_value.filter.return_value.first.return_value = user_obj
        mock_checkpw.return_value = True
        
        user = authenticate_user("test", "pass")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "test")
        mock_db.close.assert_called()

if __name__ == "__main__":
    unittest.main()
