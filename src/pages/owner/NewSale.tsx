
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import { useNewSaleLogic } from '@/hooks/owner/useNewSaleLogic';

// Import our new components
import StoreSelector from '@/components/owner/sales/StoreSelector';
import ProductSelector from '@/components/owner/sales/ProductSelector';
import CartSummary from '@/components/owner/sales/CartSummary';
import CustomerSelector from '@/components/owner/sales/CustomerSelector';
import SaleDetails from '@/components/owner/sales/SaleDetails';
import CustomerWarningDialog from '@/components/owner/sales/CustomerWarningDialog';

const OwnerNewSale = () => {
  const navigate = useNavigate();
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedStore,
    setSelectedStore,
    stores,
    storeInventory,
    cart,
    saleType,
    setSaleType,
    paidAmount,
    setPaidAmount,
    total,
    selectedCustomer,
    setSelectedCustomer,
    filteredCustomers,
    customerSearchQuery,
    setCustomerSearchQuery,
    isSubmitting,
    showCustomerWarning,
    setShowCustomerWarning,
    handleAddToCart,
    handleRemoveFromCart,
    updateItemQuantity,
    handleSubmitSale
  } = useNewSaleLogic();

  return (
    <div className="min-h-screen bg-gray-100">
      <OwnerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => navigate('/owner/sales')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-3xl font-bold">Nouvelle vente</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product selection and cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store selection */}
            <StoreSelector
              selectedStore={selectedStore}
              setSelectedStore={setSelectedStore}
              stores={stores}
            />
            
            {/* Products */}
            <ProductSelector
              products={[]}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredProducts={filteredProducts}
              selectedStore={selectedStore}
              storeInventory={storeInventory}
              onAddToCart={handleAddToCart}
            />
            
            {/* Shopping cart */}
            <CartSummary 
              cart={cart}
              updateItemQuantity={updateItemQuantity}
              handleRemoveFromCart={handleRemoveFromCart}
            />
          </div>
          
          {/* Sale summary and customer */}
          <div className="space-y-6">
            {/* Customer selection */}
            <CustomerSelector 
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              filteredCustomers={filteredCustomers}
              customerSearchQuery={customerSearchQuery}
              setCustomerSearchQuery={setCustomerSearchQuery}
            />
            
            {/* Sale summary */}
            <SaleDetails
              saleType={saleType}
              setSaleType={setSaleType}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              total={total}
              handleSubmitSale={handleSubmitSale}
              isSubmitting={isSubmitting}
              cart={cart}
              selectedStore={selectedStore}
            />
          </div>
        </div>
      </main>
      
      {/* Warning dialog for customer requirement */}
      <CustomerWarningDialog
        open={showCustomerWarning}
        onOpenChange={setShowCustomerWarning}
      />
    </div>
  );
};

export default OwnerNewSale;
