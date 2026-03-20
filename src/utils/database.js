export const CATEGORIAS = [
  {
    id: 'lacteos',
    nombre: '🥛 Lácteos',
    color: '#e3f2fd',
    colorBorder: '#90caf9',
    items: [
      { id: 'leche', nombre: 'Leche' },
      { id: 'yogurt', nombre: 'Yogurt' },
      { id: 'queso', nombre: 'Queso' },
      { id: 'mantequilla', nombre: 'Mantequilla' },
      { id: 'crema', nombre: 'Crema de leche' },
      { id: 'queso_rallado', nombre: 'Queso rallado' },
    ]
  },
  {
    id: 'frutas_verduras',
    nombre: '🥦 Frutas y Verduras',
    color: '#e8f5e9',
    colorBorder: '#a5d6a7',
    items: [
      { id: 'tomate', nombre: 'Tomate' },
      { id: 'lechuga', nombre: 'Lechuga' },
      { id: 'cebolla', nombre: 'Cebolla' },
      { id: 'papa', nombre: 'Papa' },
      { id: 'zanahoria', nombre: 'Zanahoria' },
      { id: 'pimiento', nombre: 'Pimiento' },
      { id: 'ajo', nombre: 'Ajo' },
      { id: 'limon', nombre: 'Limón' },
      { id: 'naranja', nombre: 'Naranja' },
      { id: 'manzana', nombre: 'Manzana' },
      { id: 'banana', nombre: 'Banana' },
      { id: 'espinaca', nombre: 'Espinaca' },
    ]
  },
  {
    id: 'carnes',
    nombre: '🥩 Carnes',
    color: '#fce4ec',
    colorBorder: '#f48fb1',
    items: [
      { id: 'pollo', nombre: 'Pollo' },
      { id: 'carne_molida', nombre: 'Carne molida' },
      { id: 'milanesa', nombre: 'Milanesa' },
      { id: 'chuletas', nombre: 'Chuletas' },
      { id: 'salmon', nombre: 'Salmón' },
      { id: 'atun_lata', nombre: 'Atún en lata' },
      { id: 'jamon', nombre: 'Jamón' },
      { id: 'salchicha', nombre: 'Salchicha' },
    ]
  },
  {
    id: 'panaderia',
    nombre: '🍞 Panadería',
    color: '#fff8e1',
    colorBorder: '#ffe082',
    items: [
      { id: 'pan_molde', nombre: 'Pan de molde' },
      { id: 'pan_frances', nombre: 'Pan francés' },
      { id: 'galletas', nombre: 'Galletas' },
      { id: 'tostadas', nombre: 'Tostadas' },
      { id: 'cereales', nombre: 'Cereales' },
    ]
  },
  {
    id: 'granos',
    nombre: '🌾 Granos y Pastas',
    color: '#f3e5f5',
    colorBorder: '#ce93d8',
    items: [
      { id: 'arroz', nombre: 'Arroz' },
      { id: 'fideos', nombre: 'Fideos/Pasta' },
      { id: 'lentejas', nombre: 'Lentejas' },
      { id: 'porotos', nombre: 'Porotos/Frijoles' },
      { id: 'avena', nombre: 'Avena' },
      { id: 'harina', nombre: 'Harina' },
      { id: 'maiz', nombre: 'Maíz' },
    ]
  },
  {
    id: 'bebidas',
    nombre: '🥤 Bebidas',
    color: '#e0f7fa',
    colorBorder: '#80deea',
    items: [
      { id: 'agua', nombre: 'Agua mineral' },
      { id: 'jugo', nombre: 'Jugo' },
      { id: 'refresco', nombre: 'Refresco/Gaseosa' },
      { id: 'cafe', nombre: 'Café' },
      { id: 'te', nombre: 'Té' },
      { id: 'mate', nombre: 'Yerba mate' },
    ]
  },
  {
    id: 'limpieza',
    nombre: '🧹 Limpieza',
    color: '#e8eaf6',
    colorBorder: '#9fa8da',
    items: [
      { id: 'detergente', nombre: 'Detergente' },
      { id: 'jabon_ropa', nombre: 'Jabón ropa' },
      { id: 'suavizante', nombre: 'Suavizante' },
      { id: 'limpiador', nombre: 'Limpiador multiuso' },
      { id: 'papel_hig', nombre: 'Papel higiénico' },
      { id: 'esponjas', nombre: 'Esponjas' },
      { id: 'bolsas_basura', nombre: 'Bolsas de basura' },
    ]
  },
  {
    id: 'higiene',
    nombre: '🧴 Higiene Personal',
    color: '#fce4ec',
    colorBorder: '#f48fb1',
    items: [
      { id: 'shampoo', nombre: 'Shampoo' },
      { id: 'jabon_body', nombre: 'Jabón corporal' },
      { id: 'desodorante', nombre: 'Desodorante' },
      { id: 'pasta_dental', nombre: 'Pasta dental' },
      { id: 'cepillo', nombre: 'Cepillo de dientes' },
    ]
  },
  {
    id: 'condimentos',
    nombre: '🧂 Condimentos',
    color: '#fff3e0',
    colorBorder: '#ffcc80',
    items: [
      { id: 'sal', nombre: 'Sal' },
      { id: 'azucar', nombre: 'Azúcar' },
      { id: 'aceite', nombre: 'Aceite' },
      { id: 'vinagre', nombre: 'Vinagre' },
      { id: 'salsa_tomate', nombre: 'Salsa de tomate' },
      { id: 'mayonesa', nombre: 'Mayonesa' },
      { id: 'mostaza', nombre: 'Mostaza' },
      { id: 'oregano', nombre: 'Orégano' },
    ]
  },
]

export const getCategoria = (itemId) => {
  for (const cat of CATEGORIAS) {
    if (cat.items.find(i => i.id === itemId)) return cat
  }
  return null
}
