import React, { useState, useEffect } from 'react';
import { ProductItem, NewsArticle, PublishStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_NEWS } from './utils/sampleData';
import { Navbar } from './components/Navbar';
import { NewsCollector } from './components/NewsCollector';
import { ProductTracker } from './components/ProductTracker';
import { ContentFactory } from './components/ContentFactory';
import { PublishingCalendar } from './components/PublishingCalendar';
import { AddProductModal } from './components/AddProductModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('tracker');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // LocalStorage State Initialization
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('paris_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [newsList, setNewsList] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem('paris_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [selectedProductForContent, setSelectedProductForContent] = useState<ProductItem | null>(null);

  useEffect(() => {
    localStorage.setItem('paris_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('paris_news', JSON.stringify(newsList));
  }, [newsList]);

  // Handlers
  const handleImportToInbox = (newProduct: Omit<ProductItem, 'id'>) => {
    const item: ProductItem = {
      ...newProduct,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [item, ...prev]);
  };

  const handleRemoveNews = (newsId: string) => {
    setNewsList((prev) => prev.filter((n) => n.id !== newsId));
  };

  const handleUpdateProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('이 신제품 항목을 삭제하시겠습니까?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSelectForContent = (product: ProductItem) => {
    setSelectedProductForContent(product);
    setActiveTab('factory');
  };

  const handleUpdatePublishStatus = (
    id: string, 
    field: 'naverStatus' | 'instaStatus', 
    status: PublishStatus
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: status } : p))
    );
  };

  const handleToggleImage = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imagePrepared: !p.imagePrepared } : p))
    );
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        inboxCount={newsList.length}
      />

      {/* Main Tab Content */}
      <main className="main-content">
        {activeTab === 'collector' && (
          <NewsCollector
            newsList={newsList}
            onImportToInbox={handleImportToInbox}
            onRemoveNews={handleRemoveNews}
          />
        )}

        {activeTab === 'tracker' && (
          <ProductTracker
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onSelectForContent={handleSelectForContent}
          />
        )}

        {activeTab === 'factory' && (
          <ContentFactory
            products={products}
            selectedProduct={selectedProductForContent}
            onSelectProduct={setSelectedProductForContent}
          />
        )}

        {activeTab === 'calendar' && (
          <PublishingCalendar
            products={products}
            onUpdateStatus={handleUpdatePublishStatus}
            onToggleImage={handleToggleImage}
          />
        )}
      </main>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleImportToInbox}
      />
    </div>
  );
};

export default App;
