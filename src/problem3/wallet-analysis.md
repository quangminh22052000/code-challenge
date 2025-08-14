# Problem 3: Messy React - Wallet Code Analysis

## 🔍 **Computational Inefficiencies and Anti-Patterns**

### **1. ❌ Critical Logic Error in Filter Condition**
```typescript
const sortedBalances = useMemo(() => {
  return balances.filter((balance: WalletBalance) => {
    const balancePriority = getPriority(balance.blockchain);
    if (lhsPriority > -99) {  // ❌ BUG: lhsPriority is undefined!
      if (balance.amount <= 0) {
        return true;  // ❌ Logic inverted - returns true for negative/zero amounts
      }
    }
    return false  // ❌ This will always return false due to undefined lhsPriority
  })
}, [balances, prices]);
```

**Issues:**
- `lhsPriority` is undefined - should be `balancePriority`
- Logic is completely broken - filter will always return `false`
- Returns `true` for negative/zero amounts (inverted logic)
- This means **no balances will ever be displayed**

### **2. ❌ Incomplete Sort Function**
```typescript
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);
  if (leftPriority > rightPriority) {
    return -1;
  } else if (rightPriority > leftPriority) {
    return 1;
  }
  // ❌ Missing return 0 for equal priorities
});
```

**Issues:**
- Missing `return 0` for equal priorities
- Sort function is incomplete and may cause unpredictable behavior
- Could lead to unstable sorting results

### **3. ❌ Unnecessary useMemo Dependencies**
```typescript
const sortedBalances = useMemo(() => {
  // ... filtering and sorting logic
}, [balances, prices]); // ❌ prices is not used in the calculation
```

**Issues:**
- `prices` dependency is unnecessary since it's not used in the calculation
- This causes unnecessary re-computations when prices change
- Performance degradation due to false dependency

### **4. ❌ Expensive Operations in Render Without Memoization**
```typescript
const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  }
})

const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  const usdValue = prices[balance.currency] * balance.amount; // ❌ Expensive calculation on every render
  return (
    <WalletRow 
      key={index} // ❌ Using index as React key
      // ...
    />
  )
})
```

**Issues:**
- `formattedBalances` is calculated on every render without memoization
- USD value calculation happens on every render
- Using array index as React key (major anti-pattern)
- Multiple array iterations without optimization

### **5. ❌ Type Inconsistencies**
```typescript
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  // ❌ sortedBalances is WalletBalance[], not FormattedWalletBalance[]
```

**Issues:**
- Type mismatch between `sortedBalances` (WalletBalance[]) and expected type (FormattedWalletBalance)
- Inconsistent data flow and type safety issues
- Potential runtime errors

### **6. ❌ Function Recreation on Every Render**
```typescript
const getPriority = (blockchain: any): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100
    // ...
  }
}
```

**Issues:**
- Function is recreated on every render
- `any` type instead of proper typing
- Could be memoized or moved outside component
- Performance impact from function recreation

### **7. ❌ Unused Variables and Props**
```typescript
const { children, ...rest } = props; // ❌ children is destructured but never used
```

**Issues:**
- `children` is destructured but never used
- Unnecessary destructuring
- Code clutter

### **8. ❌ Missing Properties**
```typescript
interface WalletBalance {
  currency: string;
  amount: number;
  // ❌ Missing blockchain property that's used in the code
}
```

**Issues:**
- `blockchain` property is used but not defined in interface
- Type safety compromised

## 🎯 **Refactored Solution with Detailed Comments**

```typescript
// ✅ IMPROVED: Added missing blockchain property to interface
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // ✅ Added missing property
}

// ✅ IMPROVED: Enhanced interface with additional properties
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
  blockchain: string;
  usdValue: number;
  priority: number;
}

interface Props extends BoxProps {
  children?: React.ReactNode; // ✅ Made optional
}

// ✅ IMPROVEMENT 1: Move constants outside component to prevent recreation
// This prevents the function from being recreated on every render
const BLOCKCHAIN_PRIORITIES: Record<string, number> = {
  'Osmosis': 100,
  'Ethereum': 50,
  'Arbitrum': 30,
  'Zilliqa': 20,
  'Neo': 20,
} as const;

// ✅ IMPROVEMENT 2: Move function outside component
// This prevents function recreation on every render and improves performance
const getPriority = (blockchain: string): number => {
  return BLOCKCHAIN_PRIORITIES[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // ✅ IMPROVEMENT 3: Memoized priority calculation
  // This prevents recalculating priorities on every render
  const balancesWithPriority = useMemo(() => {
    return balances.map(balance => ({
      ...balance,
      priority: getPriority(balance.blockchain)
    }));
  }, [balances]);

  // ✅ IMPROVEMENT 4: Fixed filter and sort logic with proper memoization
  // Fixed the logic error and removed unnecessary dependency
  const sortedBalances = useMemo(() => {
    return balancesWithPriority
      .filter(balance => balance.amount > 0) // ✅ Fixed: only positive amounts
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // ✅ Descending order
        }
        return 0; // ✅ Fixed: return 0 for equal priorities
      });
  }, [balancesWithPriority]); // ✅ Fixed: removed unnecessary prices dependency

  // ✅ IMPROVEMENT 5: Memoized formatted balances with USD values
  // This prevents expensive calculations on every render
  const formattedBalances = useMemo(() => {
    return sortedBalances.map(balance => {
      const usdValue = (prices[balance.currency] ?? 0) * balance.amount;
      return {
        ...balance,
        formatted: balance.amount.toFixed(2),
        usdValue
      };
    });
  }, [sortedBalances, prices]); // ✅ Now prices is actually used

  // ✅ IMPROVEMENT 6: Memoized rows with proper keys
  // This prevents unnecessary re-renders and uses stable keys
  const rows = useMemo(() => {
    return formattedBalances.map((balance) => (
      <WalletRow 
        className={classes.row}
        key={`${balance.blockchain}-${balance.currency}`} // ✅ Stable unique key
        amount={balance.amount}
        usdValue={balance.usdValue}
        formattedAmount={balance.formatted}
      />
    ));
  }, [formattedBalances]);

  return (
    <div {...rest}>
      {children} {/* ✅ Use children if provided */}
      {rows}
    </div>
  );
};
```

## 🚀 **Key Improvements Explained**

### **1. Fixed Logic Errors**
- ✅ **Corrected filter condition**: Changed from broken logic to `balance.amount > 0`
- ✅ **Added missing return statement**: Added `return 0` for equal priorities in sort function
- ✅ **Fixed type inconsistencies**: Added missing `blockchain` property to interface

### **2. Performance Optimizations**
- ✅ **Moved function outside component**: `getPriority` no longer recreated on every render
- ✅ **Proper memoization**: Used `useMemo` for expensive calculations
- ✅ **Removed unnecessary dependencies**: Removed `prices` from `sortedBalances` dependency
- ✅ **Combined operations**: Reduced multiple array iterations

### **3. Better Type Safety**
- ✅ **Added proper typing**: Used `string` instead of `any` for blockchain parameter
- ✅ **Fixed type mismatches**: Consistent types throughout the component
- ✅ **Added missing properties**: `blockchain` property in interface

### **4. React Best Practices**
- ✅ **Stable keys**: Used unique combination instead of array index
- ✅ **Proper memoization**: Memoized expensive operations
- ✅ **Removed unused variables**: Properly used `children` prop
- ✅ **Better component structure**: Cleaner, more maintainable code

### **5. Code Quality**
- ✅ **Added error handling**: Used nullish coalescing for missing prices
- ✅ **Improved readability**: Better variable names and structure
- ✅ **Consistent code style**: Proper formatting and organization

## 📊 **Performance Benefits**

- **Reduced Re-renders**: Proper memoization prevents unnecessary calculations
- **Fixed Logic**: Correct filtering and sorting behavior
- **Better Memory Usage**: Moved constants outside component
- **Type Safety**: Proper TypeScript usage prevents runtime errors
- **Maintainability**: Cleaner, more readable code structure
- **Error Prevention**: Proper error handling and validation

## 🔧 **Additional Recommendations**

1. **Add Loading States**: Handle async data fetching properly
2. **Error Boundaries**: Implement error boundaries for better error handling
3. **Virtualization**: For large lists, consider using react-window or react-virtualized
4. **Testing**: Add unit tests for the filtering and sorting logic
5. **Accessibility**: Add proper ARIA labels and keyboard navigation
6. **Internationalization**: Consider currency formatting for different locales
