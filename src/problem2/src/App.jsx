import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useQuery } from '@tanstack/react-query'
import * as Yup from 'yup'
import './App.css'

// Token data with icons
const TOKENS = [
  { symbol: 'SWTH', name: 'Switcheo', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/SWTH.svg' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg' },
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/BTC.svg' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/USDC.svg' },
  { symbol: 'USDT', name: 'Tether', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/USDT.svg' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/SOL.svg' },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ADA.svg' },
  { symbol: 'DOT', name: 'Polkadot', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/DOT.svg' },
  { symbol: 'LINK', name: 'Chainlink', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/LINK.svg' },
  { symbol: 'UNI', name: 'Uniswap', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/UNI.svg' }
]

// Validation schema
const SwapSchema = Yup.object().shape({
  fromAmount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required'),
  toAmount: Yup.number()
    .positive('Amount must be positive')
    .required('Amount is required')
})

// API function to fetch prices
const fetchPrices = async () => {
  const response = await fetch('https://interview.switcheo.com/prices.json')
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  const data = await response.json()
  
  // Convert array to object for easier lookup
  const priceMap = {}
  data.forEach(item => {
    priceMap[item.currency] = item.price
  })
  return priceMap
}

function App() {
  return (
    <div className="App">
      <CryptoExchange />
    </div>
  )
}

function CryptoExchange() {
  const [showFromModal, setShowFromModal] = useState(false)
  const [showToModal, setShowToModal] = useState(false)
  const [selectedFromToken, setSelectedFromToken] = useState(TOKENS[0])
  const [selectedToToken, setSelectedToToken] = useState(TOKENS[1])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use useQuery to fetch prices
  const { 
    data: prices = {}, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    staleTime: 30000, // Data is fresh for 30 seconds
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Calculate exchange rate
  const getExchangeRate = () => {
    const fromPrice = prices[selectedFromToken.symbol] || 0
    const toPrice = prices[selectedToToken.symbol] || 0
    
    if (fromPrice === 0 || toPrice === 0) return 0
    return toPrice / fromPrice
  }

  // Calculate USD value
  const getUSDValue = (amount, tokenSymbol) => {
    const price = prices[tokenSymbol] || 0
    return (amount * price).toFixed(2)
  }

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true)
    
    // Simulate API call with loading
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Show success message
    alert(`Successfully swapped ${values.fromAmount} ${selectedFromToken.symbol} for ${values.toAmount} ${selectedToToken.symbol}`)
    
    setIsSubmitting(false)
    setSubmitting(false)
    resetForm()
  }

  // Swap tokens
  const swapTokens = () => {
    const temp = selectedFromToken
    setSelectedFromToken(selectedToToken)
    setSelectedToToken(temp)
  }

  if (isLoading) {
    return (
      <div className="crypto-exchange">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading prices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="crypto-exchange">
        <div className="error">
          <p>Failed to load prices: {error.message}</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="crypto-exchange">
      <h1>💱 Currency Swap</h1>
      
      <Formik
        initialValues={{
          fromAmount: '',
          toAmount: ''
        }}
        validationSchema={SwapSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isValid }) => {
          const exchangeRate = getExchangeRate()
          
          // Auto-calculate to amount when from amount changes
          const handleFromAmountChange = (e) => {
            const value = e.target.value
            setFieldValue('fromAmount', value)
            if (value && exchangeRate > 0) {
              setFieldValue('toAmount', (parseFloat(value) * exchangeRate).toFixed(6))
            }
          }

          return (
            <Form className="exchange-form">
              {/* From Token */}
              <div className="input-section">
                <label>You Pay</label>
                <div className="currency-input">
                  <Field
                    name="fromAmount"
                    type="number"
                    placeholder="0.00"
                    onChange={handleFromAmountChange}
                  />
                  <TokenSelector
                    token={selectedFromToken}
                    onClick={() => setShowFromModal(true)}
                  />
                </div>
                {values.fromAmount && (
                  <div className="fiat-value">
                    ≈ ${getUSDValue(values.fromAmount, selectedFromToken.symbol)} USD
                  </div>
                )}
                <ErrorMessage name="fromAmount" component="div" className="error-message" />
              </div>

              {/* Swap Button */}
              <div className="swap-container">
                <button
                  type="button"
                  className="swap-btn"
                  onClick={swapTokens}
                >
                  <i>⇅</i>
                </button>
              </div>

              {/* To Token */}
              <div className="input-section">
                <label>You Receive</label>
                <div className="currency-input">
                  <Field
                    name="toAmount"
                    type="number"
                    placeholder="0.00"
                    readOnly
                  />
                  <TokenSelector
                    token={selectedToToken}
                    onClick={() => setShowToModal(true)}
                  />
                </div>
                {values.toAmount && (
                  <div className="fiat-value">
                    ≈ ${getUSDValue(values.toAmount, selectedToToken.symbol)} USD
                  </div>
                )}
                <ErrorMessage name="toAmount" component="div" className="error-message" />
              </div>

              {/* Exchange Rate */}
              {exchangeRate > 0 && (
                <div className="exchange-rate">
                  <span>1 {selectedFromToken.symbol} = {exchangeRate.toFixed(6)} {selectedToToken.symbol}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="exchange-btn"
                disabled={!isValid || isSubmitting || !values.fromAmount}
              >
                {isSubmitting ? 'Swapping...' : 'Swap Now'}
              </button>
            </Form>
          )
        }}
      </Formik>

      {/* Token Selection Modals */}
      {showFromModal && (
        <TokenModal
          tokens={TOKENS}
          onSelect={(token) => {
            setSelectedFromToken(token)
            setShowFromModal(false)
          }}
          onClose={() => setShowFromModal(false)}
          title="Select Token to Pay"
        />
      )}

      {showToModal && (
        <TokenModal
          tokens={TOKENS}
          onSelect={(token) => {
            setSelectedToToken(token)
            setShowToModal(false)
          }}
          onClose={() => setShowToModal(false)}
          title="Select Token to Receive"
        />
      )}
    </div>
  )
}

// Token Selector Component
function TokenSelector({ token, onClick }) {
  return (
    <div className="currency-selector" onClick={onClick}>
      <img src={token.icon} alt={token.symbol} className="token-icon" />
      <span>{token.symbol}</span>
      <i>▼</i>
    </div>
  )
}

// Token Modal Component
function TokenModal({ tokens, onSelect, onClose, title }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            className="search-input"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="token-list">
            {filteredTokens.map(token => (
              <div
                key={token.symbol}
                className="token-item"
                onClick={() => onSelect(token)}
              >
                <img src={token.icon} alt={token.symbol} className="token-icon" />
                <div className="token-info">
                  <span className="token-symbol">{token.symbol}</span>
                  <span className="token-name">{token.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
