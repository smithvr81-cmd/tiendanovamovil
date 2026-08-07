// Catálogo referencial consultado en Falabella Perú el 6 de agosto de 2026.
// El precio publicado incluye S/ 100 sobre el precio principal encontrado.
export const products = [
  {
    id: 1,
    name: 'iPhone 15 128GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 2999,
    oldPrice: 3099,
    badge: 'Precio especial',
    image: 'https://media.falabella.com/falabellaPE/20039958_01/w=800,h=800,fit=contain',
    specs: ['Pantalla de 6 pulgadas', 'Almacenamiento de 128GB', 'Cámara principal de 48 MP'],
    stock: true
  },
  {
    id: 2,
    name: 'iPhone 16e 128GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 2599,
    oldPrice: 2799,
    badge: 'Oferta',
    image: 'https://media.falabella.com/falabellaPE/20977277_1/w=800,h=800,fit=contain',
    specs: ['Pantalla de 6.1 pulgadas', 'Almacenamiento de 128GB', 'Cámara principal de 48 MP'],
    stock: true
  },
  {
    id: 3,
    name: 'iPhone 16 128GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 2999,
    oldPrice: 3599,
    badge: 'Recomendado',
    image: 'https://media.falabella.com/falabellaPE/20687063_01/w=800,h=800,fit=contain',
    specs: ['Chip A18 y conectividad 5G', 'Pantalla Super Retina XDR de 6.1”', 'Cámara principal de 48 MP'],
    stock: true
  },
  {
    id: 4,
    name: 'iPhone 17 256GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 4099,
    oldPrice: 4299,
    badge: 'Nueva generación',
    image: 'https://media.falabella.com/falabellaPE/21283538_01/w=800,h=800,fit=contain',
    specs: ['Chip A19 y conectividad 5G', 'Pantalla de 6.3” a 120Hz', 'Almacenamiento de 256GB'],
    stock: true
  },
  {
    id: 5,
    name: 'iPhone 17 Pro 256GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 5599,
    oldPrice: 5799,
    badge: 'Pro',
    image: 'https://media.falabella.com/falabellaPE/21283550_01/w=800,h=800,fit=contain',
    specs: ['Pantalla de 6.3 pulgadas', 'Almacenamiento de 256GB', 'Cámaras de 48 MP y 18 MP'],
    stock: true
  },
  {
    id: 6,
    name: 'iPhone 17 Pro Max 256GB',
    category: 'Celulares',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 6099,
    oldPrice: 6299,
    badge: 'Destacado',
    image: 'https://media.falabella.com/falabellaPE/21283554_01/w=800,h=800,fit=contain',
    specs: ['Chip A19 Pro', 'Pantalla de 6.9 pulgadas', 'Almacenamiento de 256GB'],
    stock: true
  },
  {
    id: 7,
    name: 'iPad 11” con chip A16 Wi-Fi',
    category: 'Accesorios',
    brand: 'Apple',
    condition: 'Nuevo',
    price: 1699,
    oldPrice: 2399,
    badge: 'Tablet',
    image: 'https://media.falabella.com/falabellaPE/21014911_1/w=800,h=800,fit=contain',
    specs: ['Pantalla de 11 pulgadas', 'Chip A16 y sistema iPadOS', 'Cámara principal de 12 MP'],
    stock: true
  },
  {
    id: 8,
    name: 'HP 255 G10 Ryzen 3', category: 'Laptops', brand: 'HP', condition: 'Nuevo',
    price: 1950, oldPrice: 2690, badge: 'Económica',
    image: 'https://media.falabella.com/falabellaPE/144009752_01/w=800,h=800,fit=contain',
    specs: ['AMD Ryzen 3 7320U', '8GB RAM · SSD 256GB', 'Pantalla 15.6” HD'], stock: true
  },
  {
    id: 9,
    name: 'Lenovo V15 G4 Ryzen 5', category: 'Laptops', brand: 'Lenovo', condition: 'Nuevo',
    price: 2599, oldPrice: 2990, badge: 'Oficina',
    image: 'https://media.falabella.com/falabellaPE/136298211_01/w=800,h=800,fit=contain',
    specs: ['AMD Ryzen 5 7520U', '16GB RAM · SSD 512GB', 'Pantalla 15.6” FHD · Windows 11'], stock: true
  },
  {
    id: 10,
    name: 'ASUS Vivobook 15 Core 5', category: 'Laptops', brand: 'ASUS', condition: 'Nuevo',
    price: 3139, oldPrice: 5300, badge: 'Multitarea',
    image: 'https://media.falabella.com/falabellaPE/153350725_01/w=800,h=800,fit=contain',
    specs: ['Intel Core 5 120U', '16GB RAM · SSD 512GB', 'Pantalla 15.6” FHD'], stock: true
  },
  {
    id: 11,
    name: 'Lenovo Core i5 13ª Gen', category: 'Laptops', brand: 'Lenovo', condition: 'Nuevo',
    price: 2369, oldPrice: 2900, badge: 'Estudio y oficina',
    image: 'https://media.falabella.com/falabellaPE/154903294_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i5-13420H', '8GB RAM · SSD 512GB', 'Pantalla 15.6” FHD'], stock: true
  },
  {
    id: 12,
    name: 'Acer Aspire Lite Core i7', category: 'Laptops', brand: 'Acer', condition: 'Nuevo',
    price: 3099, oldPrice: 3499, badge: 'Alto rendimiento',
    image: 'https://media.falabella.com/falabellaPE/883746914_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i7-13620H', '16GB RAM · SSD 512GB', 'Pantalla 15.6” FHD IPS'], stock: true
  },
  {
    id: 13,
    name: 'Acer Aspire Lite Core Ultra 7', category: 'Laptops', brand: 'Acer', condition: 'Nuevo',
    price: 2899, oldPrice: 2999, badge: 'Profesional',
    image: 'https://media.falabella.com/falabellaPE/883668657_1/w=800,h=800,fit=contain',
    specs: ['Intel Core Ultra 7 155U', '16GB RAM · SSD 512GB', 'Pantalla WUXGA IPS'], stock: true
  },
  {
    id: 14,
    name: 'HP 15-FD0260LA Core 5', category: 'Laptops', brand: 'HP', condition: 'Nuevo',
    price: 2599, oldPrice: 3949, badge: 'Recomendado',
    image: 'https://media.falabella.com/falabellaPE/150682492_01/w=800,h=800,fit=contain',
    specs: ['Intel Core 5 120U', '16GB RAM · SSD 512GB', 'Pantalla 15.6 pulgadas'], stock: true
  },
  {
    id: 15,
    name: 'HP 250 G10 Core i7', category: 'Laptops', brand: 'HP', condition: 'Nuevo',
    price: 3550, oldPrice: 3699, badge: 'Productividad',
    image: 'https://media.falabella.com/falabellaPE/153698403_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i7-1355U', '32GB RAM · SSD 512GB', 'Pantalla 15.6” HD'], stock: true
  },
  {
    id: 16,
    name: 'Acer Aspire 15 Core 5', category: 'Laptops', brand: 'Acer', condition: 'Nuevo',
    price: 2469, oldPrice: 5099, badge: 'Uso diario',
    image: 'https://media.falabella.com/falabellaPE/138989611_01/w=800,h=800,fit=contain',
    specs: ['Intel Core 5 120U', '8GB RAM · SSD 512GB', 'Pantalla 15.6” FHD · Windows 11'], stock: true
  },
  {
    id: 17,
    name: 'Lenovo IdeaPad Slim 3 Core i5', category: 'Laptops', brand: 'Lenovo', condition: 'Nuevo',
    price: 2598, oldPrice: 4300, badge: 'Incluye mochila',
    image: 'https://media.falabella.com/falabellaPE/153535079_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i5-13420H', '8GB RAM · SSD 512GB', 'Pantalla 15.3” FHD IPS'], stock: true
  },
  {
    id: 18,
    name: 'Dell 15 DC15250 Core i7', category: 'Laptops', brand: 'Dell', condition: 'Nuevo',
    price: 3449, oldPrice: 4809, badge: 'Empresarial',
    image: 'https://media.falabella.com/falabellaPE/123780095_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i7-1355U', '16GB RAM · SSD 512GB', 'Pantalla 15.6” FHD IPS · Windows 11'], stock: true
  },
  {
    id: 19,
    name: 'HP 15-FC0276LA Ryzen 7', category: 'Laptops', brand: 'HP', condition: 'Nuevo',
    price: 3445, oldPrice: 4100, badge: 'Gran capacidad',
    image: 'https://media.falabella.com/falabellaPE/154116272_01/w=800,h=800,fit=contain',
    specs: ['AMD Ryzen 7', '16GB RAM · SSD 1TB', 'Pantalla 15.6” FHD · Windows 11'], stock: true
  },
  {
    id: 20,
    name: 'Dell 15 Core i7 Touch', category: 'Laptops', brand: 'Dell', condition: 'Nuevo',
    price: 3699, oldPrice: 4099, badge: 'Pantalla táctil',
    image: 'https://media.falabella.com/falabellaPE/155946143_01/w=800,h=800,fit=contain',
    specs: ['Intel Core i7-1355U', '16GB RAM · SSD 512GB', 'Pantalla 15.6” FHD Touch'], stock: true
  }
];
