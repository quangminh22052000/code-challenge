import { useState, useEffect } from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <CryptoExchange />
    </div>
  )
}

function CryptoExchange() {
  const [sendAmount, setSendAmount] = useState('')
  const [receiveAmount, setReceiveAmount] = useState('')
  const [sendCurrency, setSendCurrency] = useState('BTC')
  const [receiveCurrency, setReceiveCurrency] = useState('ETH')
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'send' or 'receive'
  const [searchTerm, setSearchTerm] = useState('')

  // Available tokens with their icons
  const availableTokens = [
    { symbol: 'BTC', name: 'Bitcoin', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/BTC.svg' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg' },
    { symbol: 'USDT', name: 'Tether', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/USDT.svg' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/USDC.svg' },
    { symbol: 'SWTH', name: 'Switcheo', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/SWTH.svg' },
    { symbol: 'ADA', name: 'Cardano', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ADA.svg' },
    { symbol: 'DOT', name: 'Polkadot', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/DOT.svg' },
    { symbol: 'LINK', name: 'Chainlink', icon: 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/LINK.svg' },
  ]

  // Fetch prices from API
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://interview.switcheo.com/prices.json')
        const data = await response.json()
        const priceMap = {}
        data.forEach(item => {
          priceMap[item.currency] = item.price
        })
        setPrices(priceMap)
      } catch (error) {
        console.error('Error fetching prices:', error)
      }
    }
    fetchPrices()
  }, [])

  // Calculate exchange rate and receive amount
  useEffect(() => {
    if (sendAmount && prices[sendCurrency] && prices[receiveCurrency]) {
      const sendValue = parseFloat(sendAmount) * prices[sendCurrency]
      const receiveValue = sendValue / prices[receiveCurrency]
      setReceiveAmount(receiveValue.toFixed(8))
    } else {
      setReceiveAmount('')
    }
  }, [sendAmount, sendCurrency, receiveCurrency, prices])

  // Calculate USD values
  const getUSDValue = (amount, currency) => {
    if (!amount || !prices[currency]) return 0
    return parseFloat(amount) * prices[currency]
  }

  const sendUSDValue = getUSDValue(sendAmount, sendCurrency)
  const receiveUSDValue = getUSDValue(receiveAmount, receiveCurrency)

  // Handle currency selection
  const openCurrencyModal = (type) => {
    setModalType(type)
    setShowModal(true)
    setSearchTerm('')
  }

  const selectCurrency = (token) => {
    if (modalType === 'send') {
      setSendCurrency(token.symbol)
    } else {
      setReceiveCurrency(token.symbol)
    }
    setShowModal(false)
  }

  // Handle swap currencies
  const swapCurrencies = () => {
    const tempCurrency = sendCurrency
    const tempAmount = sendAmount
    setSendCurrency(receiveCurrency)
    setReceiveCurrency(tempCurrency)
    setSendAmount(receiveAmount)
    setReceiveAmount(tempAmount)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sendAmount || !receiveAmount) return

    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    
    // Show success message (you can replace this with actual API call)
    alert('Exchange completed successfully!')
  }

  // Filter tokens based on search
  const filteredTokens = availableTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="crypto-exchange">
      <h1>Swap</h1>
      
      <form className="exchange-form" onSubmit={handleSubmit}>
        {/* You Send Section */}
        <div className="input-section">
          <label>Amount to send</label>
          <div className="currency-input">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.00000001"
            />
            <div 
              className="currency-selector"
              onClick={() => openCurrencyModal('send')}
            >
              <img 
                src={availableTokens.find(t => t.symbol === sendCurrency)?.icon} 
                alt={sendCurrency} 
                className="token-icon"
              />
              <span>{sendCurrency}</span>
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
          <div className="fiat-value">≈${sendUSDValue.toFixed(2)}</div>
        </div>

        {/* Swap Button */}
        <div className="swap-container">
          <button 
            type="button" 
            className="swap-btn"
            onClick={swapCurrencies}
          >
            <i className="fas fa-exchange-alt"></i>
          </button>
        </div>

        {/* You Get Section */}
        <div className="input-section">
          <label>Amount to receive</label>
          <div className="currency-input">
            <input
              type="number"
              value={receiveAmount}
              placeholder="0.00"
              readOnly
            />
            <div 
              className="currency-selector"
              onClick={() => openCurrencyModal('receive')}
            >
              <img 
                src={availableTokens.find(t => t.symbol === receiveCurrency)?.icon} 
                alt={receiveCurrency} 
                className="token-icon"
              />
              <span>{receiveCurrency}</span>
              <i className="fas fa-chevron-down"></i>
            </div>
          </div>
          <div className="fiat-value">≈${receiveUSDValue.toFixed(2)}</div>
        </div>

        {/* Exchange Button */}
        <button 
          type="submit" 
          className="exchange-btn"
          disabled={!sendAmount || !receiveAmount || loading}
        >
          {loading ? 'Processing...' : 'CONFIRM SWAP'}
        </button>
      </form>

      {/* Currency Selection Modal */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Token</h3>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
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
                {filteredTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="token-item"
                    onClick={() => selectCurrency(token)}
                  >
                    <img src={token.icon} alt={token.symbol} className="token-icon" />
                    <div className="token-info">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                    {prices[token.symbol] && (
                      <span className="token-price">${prices[token.symbol].toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
