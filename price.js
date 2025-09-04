import { Contract, JsonRpcProvider, formatUnits } from 'ethers';

let POOL_ADDRESS = "0xc7bBeC68d12a0d1830360F8Ec58fA599bA1b0e9b"; // pair of WETH and USDT

const POOL_ABI = [
    'function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16,uint16,uint16,uint8,bool)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
];

const ERC20_ABI = ['function decimals() view returns (uint8)'];

async function main() {
    try {
        const provider = new JsonRpcProvider("https://ethereum-rpc.publicnode.com");

        const pool = new Contract(POOL_ADDRESS, POOL_ABI, provider);

        // Get token addresses
        const token0Address = await pool.token0();
        const token1Address = await pool.token1();

        console.log(`Token0 Address: ${token0Address}`);
        console.log(`Token1 Address: ${token1Address}`);

        // Get token decimals
        const token0Decimals = await new Contract(token0Address, ERC20_ABI, provider).decimals();
        const token1Decimals = await new Contract(token1Address, ERC20_ABI, provider).decimals();

        console.log(`Token0 Decimals: ${token0Decimals}`);
        console.log(`Token1 Decimals: ${token1Decimals}`);

        // Get current pool state
        const { sqrtPriceX96 } = await pool.slot0();

        console.log(`SqrtPriceX96: ${sqrtPriceX96}`);

        // Calculate price
        const Q192 = (2n ** 96n) ** 2n;
        const price = (BigInt(sqrtPriceX96) ** 2n * 10n ** BigInt(token0Decimals) * 10n ** 18n) / (Q192 * 10n ** BigInt(token1Decimals));
        let ethUsdt = formatUnits(price, 18);

        console.log(`1 ETH ≈ ${parseFloat(ethUsdt).toFixed(2)} USDT`);
        
        return parseFloat(ethUsdt);
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        throw error;
    }
}

// Run the main function
main()
    .then(price => {
        console.log(`Final ETH price: $${price.toFixed(2)}`);
    })
    .catch(error => {
        console.error('Failed to fetch ETH price:', error);
        process.exit(1);
    });
