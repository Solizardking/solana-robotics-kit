#!/bin/bash
# Fix script for Redis and Docker service issues
# Usage: ./fix_services.sh

set -e

echo "🔧 Fixing Service Issues"
echo "========================"
echo ""

# Check if running as root for certain operations
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Running as root. Some operations may need user permissions."
fi

# Fix Redis Bootstrap Issue
echo "1. Fixing Redis service..."
if [ -f ~/Library/LaunchAgents/homebrew.mxcl.redis.plist ]; then
    echo "   Removing corrupted Redis plist..."
    rm -f ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
    
    # Unload if still loaded
    launchctl list | grep -q redis && launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.redis.plist 2>/dev/null || true
fi

# Restart Redis service
echo "   Restarting Redis service..."
brew services restart redis 2>&1 || {
    echo "   ⚠️  brew services failed, trying manual start..."
    # Try to start Redis manually
    redis-server /opt/homebrew/etc/redis.conf --daemonize yes 2>&1 || {
        echo "   ⚠️  Manual start failed. You may need to run:"
        echo "      redis-server /opt/homebrew/etc/redis.conf"
    }
}

# Verify Redis
sleep 2
if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis is now running"
else
    echo "   ⚠️  Redis is not responding. Try running manually:"
    echo "      redis-server /opt/homebrew/etc/redis.conf"
fi

echo ""

# Fix Docker hub-tool conflict
echo "2. Checking Docker installation..."
if [ -L /usr/local/bin/hub-tool ]; then
    echo "   hub-tool symlink exists at /usr/local/bin/hub-tool"
    echo "   This is normal for Docker Desktop installations."
    echo "   ✅ Docker should work fine despite the warning"
else
    echo "   No hub-tool conflict detected"
fi

# Verify Docker
if command -v docker &> /dev/null; then
    if docker --version > /dev/null 2>&1; then
        echo "   ✅ Docker is installed and working"
    else
        echo "   ⚠️  Docker command found but not responding"
        echo "      Make sure Docker Desktop is running"
    fi
else
    echo "   ⚠️  Docker not found in PATH"
fi

echo ""

# Verify MongoDB
echo "3. Checking MongoDB..."
if brew services list | grep -q "mongodb-community.*started"; then
    echo "   ✅ MongoDB is running"
elif mongosh --version > /dev/null 2>&1; then
    echo "   ⚠️  MongoDB installed but service not started"
    echo "      Starting MongoDB..."
    brew services start mongodb-community 2>&1 || true
else
    echo "   ⚠️  MongoDB not found"
fi

echo ""

# Verify Chrome
echo "4. Checking Chrome..."
if [ -d "/Applications/Google Chrome.app" ]; then
    CHROME_VERSION=$(/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version 2>/dev/null || echo "unknown")
    echo "   ✅ Chrome is installed: $CHROME_VERSION"
else
    echo "   ⚠️  Chrome not found in Applications"
fi

echo ""
echo "✅ Service check complete!"
echo ""
echo "To verify all services:"
echo "  redis-cli ping          # Should return PONG"
echo "  mongosh --eval 'db.version()'  # Should show MongoDB version"
echo "  docker --version        # Should show Docker version"
