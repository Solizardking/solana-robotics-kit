# utils/database.py
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

from config.settings import MONGODB_URI

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB database connection manager."""
    client: Optional[AsyncIOMotorClient] = None
    db = None
    
    @classmethod
    async def connect(cls):
        """Connect to MongoDB."""
        if cls.client is None:
            cls.client = AsyncIOMotorClient(MONGODB_URI)
            # Extract database name from URI
            db_name = MONGODB_URI.split('/')[-1].split('?')[0]
            cls.db = cls.client[db_name]
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("Connected to MongoDB")
    
    @classmethod
    async def disconnect(cls):
        """Disconnect from MongoDB."""
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("Disconnected from MongoDB")
    
    @classmethod
    async def create_indexes(cls):
        """Create database indexes."""
        if cls.db is None:
            await cls.connect()
        
        # Create indexes for users collection
        await cls.db.users.create_index("email", unique=True)
        await cls.db.users.create_index("username", unique=True)
        
        # Create indexes for sessions collection
        await cls.db.sessions.create_index("user_id")
        await cls.db.sessions.create_index("token", unique=True)
        await cls.db.sessions.create_index("expires_at", expireAfterSeconds=0)
        
        # Create indexes for agent_runs collection
        await cls.db.agent_runs.create_index("user_id")
        await cls.db.agent_runs.create_index("status")
        
        logger.info("Database indexes created")
