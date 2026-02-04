// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = null;
let sortDirection = 'asc';
let currentProductId = null;

// API Base URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Initialize tooltips
let tooltipList = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', function(e) {
        handleSearch(e.target.value);
    });

    // Items per page
    document.getElementById('itemsPerPage').addEventListener('change', function(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });

    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

    // Sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            handleSort(column);
        });
    });

    // Edit button
    document.getElementById('editBtn').addEventListener('click', function() {
        const detailModal = bootstrap.Modal.getInstance(document.getElementById('detailModal'));
        detailModal.hide();
        
        // Populate edit form
        const product = allProducts.find(p => p.id === currentProductId);
        if (product) {
            console.log('Editing product:', product);
            console.log('Category ID:', product.category?.id);
            
            document.getElementById('editProductId').value = product.id;
            document.getElementById('editTitle').value = product.title;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editDescription').value = product.description;
            
            // Set category dropdown value correctly
            const categoryId = product.category?.id || '';
            const categorySelect = document.getElementById('editCategoryId');
            
            console.log('Setting category dropdown to:', categoryId);
            
            // Convert to string for comparison
            categorySelect.value = categoryId.toString();
            
            // If category not found in dropdown options, add it dynamically
            if (categoryId && categorySelect.value === '') {
                console.log('Category not in dropdown, adding option:', categoryId);
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = `${categoryId} - ${product.category?.name || 'Unknown'}`;
                option.selected = true;
                categorySelect.insertBefore(option, categorySelect.firstChild.nextSibling);
            }
            
            console.log('Category dropdown value set to:', categorySelect.value);
            
            document.getElementById('editImages').value = product.images.join(', ');
            
            const editModal = new bootstrap.Modal(document.getElementById('editModal'));
            editModal.show();
        }
    });

    // Save edit button
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);

    // Save create button
    document.getElementById('saveCreateBtn').addEventListener('click', createProduct);
}

// Load products from API
async function loadProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        document.getElementById('totalCount').textContent = allProducts.length;
        renderTable();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại!');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading spinner
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Handle search
function handleSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(term)
        );
    }
    
    currentPage = 1;
    renderTable();
}

// Handle sorting
function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    filteredProducts.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        if (column === 'title') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
    
    renderTable();
    updateSortIcons();
}

// Update sort icons
function updateSortIcons() {
    document.querySelectorAll('.sort-icon').forEach(icon => {
        const column = icon.getAttribute('data-sort');
        const iconElement = icon.querySelector('i');
        
        if (column === sortColumn) {
            if (sortDirection === 'asc') {
                iconElement.className = 'bi bi-sort-down';
            } else {
                iconElement.className = 'bi bi-sort-up';
            }
        } else {
            iconElement.className = 'bi bi-arrow-down-up';
        }
    });
}

// Render table
function renderTable() {
    // Dispose old tooltips
    tooltipList.forEach(tooltip => tooltip.dispose());
    tooltipList = [];
    
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Render rows
    currentProducts.forEach(product => {
        const row = createTableRow(product);
        tbody.appendChild(row);
    });
    
    // Initialize tooltips for descriptions
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    renderPagination();
}

// Create table row
function createTableRow(product) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-bs-toggle', 'tooltip');
    tr.setAttribute('data-bs-placement', 'left');
    tr.setAttribute('data-bs-html', 'true');
    tr.setAttribute('title', `<strong>Description:</strong><br>${escapeHtml(product.description)}`);
    tr.style.cursor = 'pointer';
    
    // Add click event to show detail modal
    tr.addEventListener('click', function() {
        showDetailModal(product);
    });
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].replace(/[\[\]"]/g, '') 
        : 'https://via.placeholder.com/50';
    
    tr.innerHTML = `
        <td>${product.id}</td>
        <td>${escapeHtml(product.title)}</td>
        <td>$${product.price}</td>
        <td>${product.category?.name || 'N/A'}</td>
        <td><img src="${imageUrl}" alt="Product" class="product-image" onerror="this.src='https://via.placeholder.com/50'"></td>
    `;
    
    return tr;
}

// Show detail modal
function showDetailModal(product) {
    currentProductId = product.id;
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].replace(/[\[\]"]/g, '') 
        : 'https://via.placeholder.com/200';
    
    const modalBody = document.getElementById('detailModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${imageUrl}" class="img-fluid rounded" alt="Product" onerror="this.src='https://via.placeholder.com/200'">
            </div>
            <div class="col-md-8">
                <h4>${escapeHtml(product.title)}</h4>
                <p class="text-muted">ID: ${product.id}</p>
                <h5 class="text-primary">$${product.price}</h5>
                <hr>
                <p><strong>Description:</strong></p>
                <p>${escapeHtml(product.description)}</p>
                <p><strong>Category:</strong> ${product.category?.name || 'N/A'}</p>
                <p><strong>Category ID:</strong> ${product.category?.id || 'N/A'}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// Save edit
async function saveEdit() {
    const productId = document.getElementById('editProductId').value;
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const categoryId = parseInt(document.getElementById('editCategoryId').value);
    const imagesText = document.getElementById('editImages').value.trim();
    
    // Validate
    if (!title || !description) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        alert('Giá sản phẩm phải là số dương!');
        return;
    }
    
    if (isNaN(categoryId) || categoryId <= 0) {
        alert('Category ID phải là số dương (từ 1-5)!');
        return;
    }
    
    // Parse images
    let images = [];
    if (imagesText) {
        images = imagesText.split(',').map(img => img.trim()).filter(img => img);
    }
    
    // Nếu không có image, dùng placeholder
    if (images.length === 0) {
        images = ["https://placehold.co/600x400"];
    }
    
    const updateData = {
        title: title,
        price: price,
        description: description,
        categoryId: categoryId,
        images: images
    };
    
    console.log('Updating product ID', productId, 'with data:', updateData);
    
    try {
        const response = await fetch(`${API_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to update product: ${response.status}`);
        }
        
        const updatedProduct = await response.json();
        console.log('Updated product:', updatedProduct);
        
        // Update local data
        const index = allProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            allProducts[index] = updatedProduct;
            filteredProducts = [...allProducts];
            renderTable();
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        
        alert(`Cập nhật sản phẩm thành công!\n\nID: ${updatedProduct.id}\nTitle: ${updatedProduct.title}\nPrice: $${updatedProduct.price}`);
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Không thể cập nhật sản phẩm. Vui lòng kiểm tra:\n- Title không được để trống\n- Price phải là số dương\n- Category ID hợp lệ (1-5)\n- Images là URL hợp lệ\n\nChi tiết lỗi: ' + error.message);
    }
}

// Create product
async function createProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesText = document.getElementById('createImages').value.trim();
    
    // Validate
    if (!title || !price || !description || !categoryId) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        alert('Giá sản phẩm phải là số dương!');
        return;
    }
    
    if (isNaN(categoryId) || categoryId <= 0) {
        alert('Category ID phải là số dương (thường từ 1-5)!');
        return;
    }
    
    // Parse images - nếu không có thì dùng placeholder
    let images = [];
    if (imagesText) {
        images = imagesText.split(',').map(img => img.trim()).filter(img => img);
    }
    
    // Nếu không có image nào hoặc rỗng, dùng placeholder
    if (images.length === 0) {
        images = ["https://placehold.co/600x400"];
    }
    
    const newProductData = {
        title: title,
        price: price,
        description: description,
        categoryId: categoryId,
        images: images
    };
    
    console.log('Creating product with data:', newProductData);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProductData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to create product: ${response.status}`);
        }
        
        const createdProduct = await response.json();
        console.log('Created product:', createdProduct);
        
        // Add to local data at the beginning
        allProducts.unshift(createdProduct);
        filteredProducts = [...allProducts];
        document.getElementById('totalCount').textContent = allProducts.length;
        currentPage = 1;
        renderTable();
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();
        document.getElementById('createForm').reset();
        
        // Show success message with product details
        alert(`Tạo sản phẩm mới thành công!\n\nID: ${createdProduct.id}\nTitle: ${createdProduct.title}\nPrice: $${createdProduct.price}`);
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Không thể tạo sản phẩm. Vui lòng kiểm tra:\n- Title không được để trống\n- Price phải là số dương\n- Category ID hợp lệ (1-5)\n- Images là URL hợp lệ\n\nChi tiết lỗi: ' + error.message);
    }
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Trước</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    pagination.appendChild(prevLi);
    
    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(e.target.getAttribute('data-page'));
            renderTable();
        });
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Sau</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    pagination.appendChild(nextLi);
}

// Export to CSV
function exportToCSV() {
    // Get current view data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Create CSV content
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description', 'Images'];
    const csvContent = [
        headers.join(','),
        ...currentProducts.map(product => {
            const imageUrls = product.images ? product.images.join(';') : '';
            return [
                product.id,
                `"${product.title.replace(/"/g, '""')}"`,
                product.price,
                `"${product.category?.name || 'N/A'}"`,
                `"${product.description.replace(/"/g, '""')}"`,
                `"${imageUrls}"`
            ].join(',');
        })
    ].join('\n');
    
    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `products_page_${currentPage}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}