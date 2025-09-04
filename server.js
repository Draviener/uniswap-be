import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// API endpoint to get ETH price
app.get('/api/eth-price', async (req, res) => {
    try {
        // Run the price.js script and capture output
        const priceProcess = spawn('node', ['price.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        priceProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        priceProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        priceProcess.on('close', (code) => {
            if (code === 0) {
                // Extract price from output
                const priceMatch = output.match(/1 ETH ≈ \$?([\d,]+\.?\d*)/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(',', ''));
                    res.json({
                        success: true,
                        price: price,
                        timestamp: new Date().toISOString(),
                        source: 'Uniswap V3'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Could not parse price from output'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: errorOutput || 'Failed to fetch price'
                });
            }
        });

    } catch (error) {
        console.error('Error fetching ETH price:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get portfolio data
app.get('/api/portfolio/:address', (req, res) => {
    const { address } = req.params;
    
    // Mock portfolio data - in a real app, you'd query the blockchain
    const mockPortfolio = {
        ETH: 2.5,
        USDT: 1000,
        totalValueUSD: 12135.58 // This would be calculated based on current prices
    };

    res.json({
        success: true,
        address: address,
        portfolio: mockPortfolio,
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get transaction history
app.get('/api/transactions/:address', (req, res) => {
    const { address } = req.params;
    
    // Mock transaction data
    const mockTransactions = [
        {
            id: 1,
            type: 'send',
            from: address,
            to: '0x1234567890123456789012345678901234567890',
            amount: 0.5,
            token: 'ETH',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            status: 'confirmed'
        },
        {
            id: 2,
            type: 'receive',
            from: '0x9876543210987654321098765432109876543210',
            to: address,
            amount: 1.2,
            token: 'ETH',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            status: 'confirmed'
        },
        {
            id: 3,
            type: 'send',
            from: address,
            to: '0x9999888877776666555544443333222211110000',
            amount: 100,
            token: 'USDT',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            status: 'confirmed'
        }
    ];

    res.json({
        success: true,
        address: address,
        transactions: mockTransactions,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
    console.log(`📊 ETH Price API: http://localhost:${PORT}/api/eth-price`);
    console.log(`💼 Portfolio API: http://localhost:${PORT}/api/portfolio/:address`);
    console.log(`📝 Transactions API: http://localhost:${PORT}/api/transactions/:address`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});
