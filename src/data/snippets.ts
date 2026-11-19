import { CodeSnippet, ConceptMeta, Concept } from '../types';

export const CONCEPTS_META: Record<Concept, ConceptMeta> = {
  recursion: {
    id: 'recursion',
    label: 'Recursión',
    shortDesc: 'Llamadas recursivas, caso base y acumulación en el stack',
    examTrap: 'Evaluar el stack en orden inverso (desenrollado) vs orden de invocación.'
  },
  slicing: {
    id: 'slicing',
    label: 'Slicing',
    shortDesc: 'Indexación avanzada, pasos negativos y límites excluyentes',
    examTrap: 'Confundir límites abiertos [inicio:fin] donde fin no se incluye, o pasos negativos [::-1].'
  },
  list_aliasing: {
    id: 'list_aliasing',
    label: 'Alias de Listas',
    shortDesc: 'Paso por referencia, mutabilidad in-place y copias superficiales',
    examTrap: 'Creer que a = b o [[0]*3]*3 crea copias independientes en memoria.'
  },
  scope: {
    id: 'scope',
    label: 'Ámbito de Variables',
    shortDesc: 'Variables locales, globales, closures y shadowing (LEGB)',
    examTrap: 'Asumir que modificar una variable dentro de una función altera la exterior sin global/nonlocal.'
  },
  nested_loops: {
    id: 'nested_loops',
    label: 'Bucles Anidados',
    shortDesc: 'Iteraciones multidimensionales, matrices, break y continue',
    examTrap: 'Perder el rastro del estado interno de acumuladores o la condición de salida del bucle interno.'
  },
  mutable_defaults: {
    id: 'mutable_defaults',
    label: 'Argumentos Mutables por Defecto',
    shortDesc: 'Listas/diccionarios persistentes como parámetros opcionales',
    examTrap: 'Creer que el argumento por defecto se reinicializa en cada llamada a la función.'
  }
};

export const SNIPPETS_BANK: CodeSnippet[] = [
  // ==========================================
  // 1. RECURSIÓN (7 snippets)
  // ==========================================
  {
    id: 'rec_1',
    title: 'Desenrollado de Pila Simple',
    concept: 'recursion',
    difficulty: 'básico',
    originalCode: `def misterio(n):
    if n <= 0:
        return 0
    return n + misterio(n - 1)

print(misterio(4))`,
    expectedOriginalOutput: '10',
    mutations: [
      {
        id: 'rec_1_m1',
        mutationType: 'Operador de acumulación',
        line: 4,
        originalSnippet: 'return n + misterio(n - 1)',
        mutatedSnippet: 'return n * misterio(n - 1)',
        mutatedCode: `def misterio(n):
    if n <= 0:
        return 0
    return n * misterio(n - 1)

print(misterio(4))`,
        expectedMutatedOutput: '0',
        hint1_concept: 'Este reto evalúa el desenrollado de la pila y el valor devuelto por el caso base.',
        hint2_line: 'Mira la línea 4: la suma fue reemplazada por multiplicación, y el caso base retorna 0.',
        explanation: 'Al mutar la suma por multiplicación, la llamada base cuando n=0 retorna 0. Cualquier número multiplicado por 0 en el retorno de la recursión anula todo el producto a 0.'
      },
      {
        id: 'rec_1_m2',
        mutationType: 'Límite caso base',
        line: 2,
        originalSnippet: 'if n <= 0:',
        mutatedSnippet: 'if n <= 2:',
        mutatedCode: `def misterio(n):
    if n <= 2:
        return 0
    return n + misterio(n - 1)

print(misterio(4))`,
        expectedMutatedOutput: '7',
        hint1_concept: 'Evalúa la condición de corte o caso base de la recursión.',
        hint2_line: 'Línea 2: la recursión ahora se detiene cuando n llega a 2, devolviendo 0 tempranamente.',
        explanation: 'Con n <= 2 retornando 0: misterio(4) = 4 + misterio(3) = 4 + (3 + misterio(2)) = 4 + 3 + 0 = 7.'
      }
    ]
  },
  {
    id: 'rec_2',
    title: 'Inversión de Orden de Impresión',
    concept: 'recursion',
    difficulty: 'básico',
    originalCode: `def contar(n):
    if n == 0:
        return
    print(n)
    contar(n - 1)

contar(3)`,
    expectedOriginalOutput: '3\n2\n1',
    mutations: [
      {
        id: 'rec_2_m1',
        mutationType: 'Posición de efecto colateral (print)',
        line: 4,
        originalSnippet: 'print(n)\n    contar(n - 1)',
        mutatedSnippet: 'contar(n - 1)\n    print(n)',
        mutatedCode: `def contar(n):
    if n == 0:
        return
    contar(n - 1)
    print(n)

contar(3)`,
        expectedMutatedOutput: '1\n2\n3',
        hint1_concept: 'Orden de ejecución: antes de la llamada recursiva vs después de que la pila regresa.',
        hint2_line: 'Línea 4-5: la llamada recursiva se colocó ANTES de la impresión en consola.',
        explanation: 'Al colocar contar(n - 1) antes de print(n), la ejecución baja hasta el caso base (n=0) y los números se imprimen al desapilarse los marcos de activación (1, luego 2, luego 3).'
      }
    ]
  },
  {
    id: 'rec_3',
    title: 'Fibonacci con Salto Asimétrico',
    concept: 'recursion',
    difficulty: 'medio',
    originalCode: `def salto(n):
    if n <= 1:
        return 1
    return salto(n - 1) + salto(n - 2)

print(salto(4))`,
    expectedOriginalOutput: '5',
    mutations: [
      {
        id: 'rec_3_m1',
        mutationType: 'Modificación de paso recursivo',
        line: 4,
        originalSnippet: 'return salto(n - 1) + salto(n - 2)',
        mutatedSnippet: 'return salto(n - 1) + 2',
        mutatedCode: `def salto(n):
    if n <= 1:
        return 1
    return salto(n - 1) + 2

print(salto(4))`,
        expectedMutatedOutput: '7',
        hint1_concept: 'Este reto analiza la reducción a una recursión lineal de acumulación fija.',
        hint2_line: 'Línea 4: la segunda rama recursiva fue reemplazada por la constante 2.',
        explanation: 'salto(4) = salto(3)+2 = (salto(2)+2)+2 = ((salto(1)+2)+2)+2 = 1 + 2 + 2 + 2 = 7.'
      }
    ]
  },
  {
    id: 'rec_4',
    title: 'Conteo de Elementos en Lista Anidada',
    concept: 'recursion',
    difficulty: 'medio',
    originalCode: `def aplanar_len(data):
    if not isinstance(data, list):
        return 1
    total = 0
    for item in data:
        total += aplanar_len(item)
    return total

print(aplanar_len([1, [2, 3], [4, [5]]]))`,
    expectedOriginalOutput: '5',
    mutations: [
      {
        id: 'rec_4_m1',
        mutationType: 'Condición tipo hoja vs contenedor',
        line: 2,
        originalSnippet: 'if not isinstance(data, list):',
        mutatedSnippet: 'if isinstance(data, list) and len(data) == 0:',
        mutatedCode: `def aplanar_len(data):
    if not isinstance(data, list):
        return 0
    total = 0
    for item in data:
        total += aplanar_len(item)
    return total + 1

print(aplanar_len([1, [2, 3], [4, [5]]]))`,
        expectedMutatedOutput: '4',
        hint1_concept: 'Conteo de nodos hoja vs nodos internos de una estructura anidada.',
        hint2_line: 'Línea 3 y 7: las hojas aportan 0 y cada sublista aporta +1.',
        explanation: 'En este árbol, hay 4 listas en total: la raíz, [2,3], [4, [5]], y [5]. Como cada lista retorna total + 1 y las hojas no listas retornan 0, la salida total es 4.'
      }
    ]
  },
  {
    id: 'rec_5',
    title: 'Recursión Cruzada con Retorno Alternante',
    concept: 'recursion',
    difficulty: 'medio',
    originalCode: `def f(n):
    if n <= 0:
        return 1
    return n - f(n - 1)

print(f(5))`,
    expectedOriginalOutput: '3',
    mutations: [
      {
        id: 'rec_5_m1',
        mutationType: 'Inversión de signo en resta',
        line: 4,
        originalSnippet: 'return n - f(n - 1)',
        mutatedSnippet: 'return f(n - 1) - n',
        mutatedCode: `def f(n):
    if n <= 0:
        return 1
    return f(n - 1) - n

print(f(5))`,
        expectedMutatedOutput: '-14',
        hint1_concept: 'Acumulación de signos negativos alternados en la pila recursiva.',
        hint2_line: 'Línea 4: ahora es f(n - 1) - n en lugar de n - f(n - 1).',
        explanation: 'f(0)=1. f(1)=1-1=0. f(2)=0-2=-2. f(3)=-2-3=-5. f(4)=-5-4=-9. f(5)=-9-5=-14.'
      }
    ]
  },
  {
    id: 'rec_6',
    title: 'Búsqueda Binaria Pura y Paso de Límites',
    concept: 'recursion',
    difficulty: 'avanzado',
    originalCode: `def busq(arr, x, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2
    if arr[mid] == x:
        return mid
    elif arr[mid] > x:
        return busq(arr, x, low, mid - 1)
    else:
        return busq(arr, x, mid + 1, high)

numeros = [10, 20, 30, 40, 50, 60, 70]
print(busq(numeros, 60, 0, 6))`,
    expectedOriginalOutput: '5',
    mutations: [
      {
        id: 'rec_6_m1',
        mutationType: 'Límite de subdivisión off-by-one',
        line: 8,
        originalSnippet: 'return busq(arr, x, low, mid - 1)',
        mutatedSnippet: 'return busq(arr, x, mid, high)',
        mutatedCode: `def busq(arr, x, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2
    if arr[mid] == x:
        return mid
    elif arr[mid] > x:
        return busq(arr, x, low, mid - 1)
    else:
        return busq(arr, x, mid + 2, high)

numeros = [10, 20, 30, 40, 50, 60, 70]
print(busq(numeros, 60, 0, 6))`,
        expectedMutatedOutput: '-1',
        hint1_concept: 'Cálculo de índices en algoritmos recursivos divide y vencerás.',
        hint2_line: 'Línea 11: el avance de la cota inferior salta 2 posiciones (mid + 2) en vez de (mid + 1).',
        explanation: 'En el primer paso mid=3 (valor 40 < 60). Salta con low = mid + 2 = 5. En el paso siguiente low=5, high=6 -> mid=(5+6)//2 = 5 (valor 60). ¡Pero ojo con el paso siguiente si hubiera saltado! En este caso mid+2 hace que low sea 5, arr[5]==60 devuelve 5 si no se desvía, pero al mutar mid+2 en arr[3], salta directamente a la posición 5.'
      }
    ]
  },
  {
    id: 'rec_7',
    title: 'Ackermann Reducido con Condición Doble',
    concept: 'recursion',
    difficulty: 'avanzado',
    originalCode: `def ack(m, n):
    if m == 0:
        return n + 1
    elif n == 0:
        return ack(m - 1, 1)
    else:
        return ack(m - 1, ack(m, n - 1))

print(ack(2, 2))`,
    expectedOriginalOutput: '7',
    mutations: [
      {
        id: 'rec_7_m1',
        mutationType: 'Caso base n==0',
        line: 5,
        originalSnippet: 'return ack(m - 1, 1)',
        mutatedSnippet: 'return ack(m - 1, 0)',
        mutatedCode: `def ack(m, n):
    if m == 0:
        return n + 1
    elif n == 0:
        return ack(m - 1, 0)
    else:
        return ack(m - 1, ack(m, n - 1))

print(ack(2, 2))`,
        expectedMutatedOutput: '3',
        hint1_concept: 'Recursión anidada profunda y propagación de valor en ramificaciones.',
        hint2_line: 'Línea 5: ack(m - 1, 1) fue cambiado a ack(m - 1, 0).',
        explanation: 'Reducir el segundo argumento a 0 cuando n=0 reduce dramáticamente el crecimiento del valor retornado: ack(2,2) pasa de 7 a 3.'
      }
    ]
  },

  // ==========================================
  // 2. SLICING (7 snippets)
  // ==========================================
  {
    id: 'slc_1',
    title: 'Slicing con Paso Negativo e Índices Omitidos',
    concept: 'slicing',
    difficulty: 'básico',
    originalCode: `texto = "INGENIERIA"
fragmento = texto[1:8:2]
print(fragmento)`,
    expectedOriginalOutput: 'NEIE',
    mutations: [
      {
        id: 'slc_1_m1',
        mutationType: 'Paso invertido en slice',
        line: 2,
        originalSnippet: 'fragmento = texto[1:8:2]',
        mutatedSnippet: 'fragmento = texto[8:1:-2]',
        mutatedCode: `texto = "INGENIERIA"
fragmento = texto[8:1:-2]
print(fragmento)`,
        expectedMutatedOutput: 'IRIN',
        hint1_concept: 'Slicing de cadenas con paso negativo e índices excluyentes.',
        hint2_line: 'Línea 2: se invirtieron inicio y fin con paso -2 (empieza en índice 8).',
        explanation: 'texto[8:1:-2]: índice 8 es "I", retrocede 2 pasos a índice 6 ("R"), retrocede 2 pasos a índice 4 ("I"), retrocede a índice 2 ("N"). El índice 1 no se incluye porque el límite superior/inferior siempre es estricto. Resultado: "IRIN".'
      }
    ]
  },
  {
    id: 'slc_2',
    title: 'Sublistas Excluyentes en Rangos Positivos',
    concept: 'slicing',
    difficulty: 'básico',
    originalCode: `nums = [10, 20, 30, 40, 50, 60]
sub = nums[2:5]
print(sum(sub))`,
    expectedOriginalOutput: '120',
    mutations: [
      {
        id: 'slc_2_m1',
        mutationType: 'Límite de fin excluyente',
        line: 2,
        originalSnippet: 'sub = nums[2:5]',
        mutatedSnippet: 'sub = nums[2:-2]',
        mutatedCode: `nums = [10, 20, 30, 40, 50, 60]
sub = nums[2:-2]
print(sum(sub))`,
        expectedMutatedOutput: '70',
        hint1_concept: 'Indexación negativa como cota superior en una lista.',
        hint2_line: 'Línea 2: el fin ahora es -2 (excluye desde los últimos 2 elementos).',
        explanation: 'nums[2:-2] toma desde el índice 2 ([30]) hasta antes de -2 (que es 50). Solo incluye [30, 40]. La suma es 30 + 40 = 70.'
      }
    ]
  },
  {
    id: 'slc_3',
    title: 'Asignación por Slice In-Place',
    concept: 'slicing',
    difficulty: 'medio',
    originalCode: `valores = [1, 2, 3, 4, 5]
valores[1:4] = [99]
print(len(valores), valores[-1])`,
    expectedOriginalOutput: '3 5',
    mutations: [
      {
        id: 'slc_3_m1',
        mutationType: 'Rango de sustitución in-place',
        line: 2,
        originalSnippet: 'valores[1:4] = [99]',
        mutatedSnippet: 'valores[1:2] = [99, 88]',
        mutatedCode: `valores = [1, 2, 3, 4, 5]
valores[1:2] = [99, 88]
print(len(valores), valores[-1])`,
        expectedMutatedOutput: '6 5',
        hint1_concept: 'Reemplazo de porciones de listas: sustituir un slice puede cambiar el tamaño de la lista.',
        hint2_line: 'Línea 2: se reemplaza sólo el elemento en índice 1 por dos elementos [99, 88].',
        explanation: 'valores[1:2] selecciona únicamente el elemento [2]. Al reemplazarlo por [99, 88], la lista se expande a [1, 99, 88, 3, 4, 5]. Longitud es 6 y el último sigue siendo 5.'
      }
    ]
  },
  {
    id: 'slc_4',
    title: 'Inversión Total con Truncado Previo',
    concept: 'slicing',
    difficulty: 'medio',
    originalCode: `datos = [10, 20, 30, 40, 50, 60, 70]
res = datos[:-2][::-2]
print(res)`,
    expectedOriginalOutput: '[50, 30, 10]',
    mutations: [
      {
        id: 'slc_4_m1',
        mutationType: 'Paso en composición de slices encadenados',
        line: 2,
        originalSnippet: 'res = datos[:-2][::-2]',
        mutatedSnippet: 'res = datos[2:][::-2]',
        mutatedCode: `datos = [10, 20, 30, 40, 50, 60, 70]
res = datos[2:][::-2]
print(res)`,
        expectedMutatedOutput: '[70, 50, 30]',
        hint1_concept: 'Encadenamiento de operaciones de slice: primero corte inicial, luego paso.',
        hint2_line: 'Línea 2: datos[2:] descarta los primeros 2 en lugar de los últimos 2.',
        explanation: 'datos[2:] da [30, 40, 50, 60, 70]. Aplicarle [::-2] invierte con paso 2: [70, 50, 30].'
      }
    ]
  },
  {
    id: 'slc_5',
    title: 'Slice en Tuplas y Empaquetado',
    concept: 'slicing',
    difficulty: 'medio',
    originalCode: `tup = (1, 2, 3, 4, 5, 6)
a, *b, c = tup[1:-1]
print(b)`,
    expectedOriginalOutput: '[3, 4]',
    mutations: [
      {
        id: 'slc_5_m1',
        mutationType: 'Recorte de tupla antes de unpacking',
        line: 2,
        originalSnippet: 'a, *b, c = tup[1:-1]',
        mutatedSnippet: 'a, *b, c = tup[::2]',
        mutatedCode: `tup = (1, 2, 3, 4, 5, 6)
a, *b, c = tup[::2]
print(b)`,
        expectedMutatedOutput: '[3]',
        hint1_concept: 'Combinación de slice con desempaquetado de secuencias (*resto).',
        hint2_line: 'Línea 2: tup[::2] genera (1, 3, 5). Observa qué queda en b.',
        explanation: 'tup[::2] es (1, 3, 5). Al desempaquetar a, *b, c: a=1, c=5, y b captura los elementos intermedios como lista: [3].'
      }
    ]
  },
  {
    id: 'slc_6',
    title: 'Matrices Planas y Rebanadas por Filas',
    concept: 'slicing',
    difficulty: 'avanzado',
    originalCode: `grid = [1, 2, 3, 4, 5, 6, 7, 8, 9]
diag = [grid[i] for i in range(0, 9, 4)]
print(diag)`,
    expectedOriginalOutput: '[1, 5, 9]',
    mutations: [
      {
        id: 'slc_6_m1',
        mutationType: 'Paso de diagonal inversa',
        line: 2,
        originalSnippet: 'diag = [grid[i] for i in range(0, 9, 4)]',
        mutatedSnippet: 'diag = [grid[i] for i in range(2, 7, 2)]',
        mutatedCode: `grid = [1, 2, 3, 4, 5, 6, 7, 8, 9]
diag = [grid[i] for i in range(2, 7, 2)]
print(diag)`,
        expectedMutatedOutput: '[3, 5, 7]',
        hint1_concept: 'Cálculo de índices para la contra-diagonal en una representación 1D de matriz 3x3.',
        hint2_line: 'Línea 2: el range va de 2 a 7 con paso 2.',
        explanation: 'range(2, 7, 2) produce los índices 2, 4 y 6. grid[2]=3, grid[4]=5, grid[6]=7. La contra-diagonal es [3, 5, 7].'
      }
    ]
  },
  {
    id: 'slc_7',
    title: 'Asignación de Slice con Salto (Extended Slice Assignment)',
    concept: 'slicing',
    difficulty: 'avanzado',
    originalCode: `sec = [0] * 6
sec[::2] = [10, 20, 30]
print(sec)`,
    expectedOriginalOutput: '[10, 0, 20, 0, 30, 0]',
    mutations: [
      {
        id: 'slc_7_m1',
        mutationType: 'Inicio de asignación extendida',
        line: 2,
        originalSnippet: 'sec[::2] = [10, 20, 30]',
        mutatedSnippet: 'sec[1::2] = [10, 20, 30]',
        mutatedCode: `sec = [0] * 6
sec[1::2] = [10, 20, 30]
print(sec)`,
        expectedMutatedOutput: '[0, 10, 0, 20, 0, 30]',
        hint1_concept: 'Asignación de slices con step: los elementos asignados deben coincidir exactamente con el número de huecos.',
        hint2_line: 'Línea 2: sec[1::2] asigna en las posiciones impares (1, 3, 5).',
        explanation: 'sec[1::2] coloca los valores en los índices 1, 3 y 5, dejando los índices pares en 0: [0, 10, 0, 20, 0, 30].'
      }
    ]
  },

  // ==========================================
  // 3. ALIAS DE LISTAS / REFERENCIAS (7 snippets)
  // ==========================================
  {
    id: 'ali_1',
    title: 'Asignación Directa vs Copia Superficial',
    concept: 'list_aliasing',
    difficulty: 'básico',
    originalCode: `a = [1, 2, 3]
b = a
b.append(4)
print(len(a), a[-1])`,
    expectedOriginalOutput: '4 4',
    mutations: [
      {
        id: 'ali_1_m1',
        mutationType: 'Copia superficial con slice [:]',
        line: 2,
        originalSnippet: 'b = a',
        mutatedSnippet: 'b = a[:]',
        mutatedCode: `a = [1, 2, 3]
b = a[:]
b.append(4)
print(len(a), a[-1])`,
        expectedMutatedOutput: '3 3',
        hint1_concept: 'Diferencia crucial entre alias (misma referencia) y copia superficial (nuevo objeto).',
        hint2_line: 'Línea 2: b = a[:] crea una nueva lista independiente en memoria.',
        explanation: 'Con b = a[:], b es una copia distinta de a. Modificar b no afecta a a. Por lo tanto, a sigue teniendo 3 elementos y su último valor es 3.'
      }
    ]
  },
  {
    id: 'ali_2',
    title: 'La Trampa Clásica de la Matriz [[0]*3]*3',
    concept: 'list_aliasing',
    difficulty: 'básico',
    originalCode: `matriz = [[0] * 3 for _ in range(3)]
matriz[0][0] = 5
print(matriz[1][0])`,
    expectedOriginalOutput: '0',
    mutations: [
      {
        id: 'ali_2_m1',
        mutationType: 'Multiplicación de referencias de listas',
        line: 1,
        originalSnippet: 'matriz = [[0] * 3 for _ in range(3)]',
        mutatedSnippet: 'matriz = [[0] * 3] * 3',
        mutatedCode: `matriz = [[0] * 3] * 3
matriz[0][0] = 5
print(matriz[1][0])`,
        expectedMutatedOutput: '5',
        hint1_concept: 'El operador * en listas replica la referencia del objeto interno, no su contenido.',
        hint2_line: 'Línea 1: la matriz se creó con [[0] * 3] * 3 en lugar de una comprensión de lista.',
        explanation: '[[0] * 3] * 3 crea una lista de 3 elementos donde los 3 elementos son LA MISMA lista en memoria. Al mutar matriz[0][0] = 5, todas las filas reflejan el cambio, por lo que matriz[1][0] también es 5.'
      }
    ]
  },
  {
    id: 'ali_3',
    title: 'Modificación Dentro de Función: In-Place vs Reasignación',
    concept: 'list_aliasing',
    difficulty: 'medio',
    originalCode: `def alterar(lista):
    lista.append(100)

valores = [1, 2]
alterar(valores)
print(valores)`,
    expectedOriginalOutput: '[1, 2, 100]',
    mutations: [
      {
        id: 'ali_3_m1',
        mutationType: 'Concatenación reasignada en lugar de append',
        line: 2,
        originalSnippet: 'lista.append(100)',
        mutatedSnippet: 'lista = lista + [100]',
        mutatedCode: `def alterar(lista):
    lista = lista + [100]

valores = [1, 2]
alterar(valores)
print(valores)`,
        expectedMutatedOutput: '[1, 2]',
        hint1_concept: 'Mutación in-place (.append) vs creación de nueva variable local con el operador +.',
        hint2_line: 'Línea 2: lista = lista + [100] crea una nueva lista local y no muta el argumento recibido.',
        explanation: 'El operador + crea una nueva lista en memoria y reasigna el identificador local "lista". La lista original "valores" fuera de la función no es modificada y permanece [1, 2].'
      }
    ]
  },
  {
    id: 'ali_4',
    title: 'Operador += en Listas vs Identidad de Objeto',
    concept: 'list_aliasing',
    difficulty: 'medio',
    originalCode: `x = [1, 2]
y = x
x += [3]
print(x is y, len(y))`,
    expectedOriginalOutput: 'True 3',
    mutations: [
      {
        id: 'ali_4_m1',
        mutationType: 'Reasignación explícita con +',
        line: 3,
        originalSnippet: 'x += [3]',
        mutatedSnippet: 'x = x + [3]',
        mutatedCode: `x = [1, 2]
y = x
x = x + [3]
print(x is y, len(y))`,
        expectedMutatedOutput: 'False 2',
        hint1_concept: 'En Python, += en listas llama a __iadd__ (mutación in-place), pero x = x + ... crea un nuevo objeto.',
        hint2_line: 'Línea 3: x = x + [3] desvincula la identidad de x respecto a y.',
        explanation: 'Para listas, x += [3] muta in-place (x is y sigue siendo True). Pero x = x + [3] crea un nuevo objeto lista asignado a x. Ahora x is y es False y y mantiene su longitud original de 2.'
      }
    ]
  },
  {
    id: 'ali_5',
    title: 'Lista de Objetos Mutables Compartidos',
    concept: 'list_aliasing',
    difficulty: 'medio',
    originalCode: `comun = {'puntos': 0}
jugadores = [comun, comun.copy()]
jugadores[0]['puntos'] += 10
print(jugadores[1]['puntos'])`,
    expectedOriginalOutput: '0',
    mutations: [
      {
        id: 'ali_5_m1',
        mutationType: 'Referencia compartida en ambos slots',
        line: 2,
        originalSnippet: 'jugadores = [comun, comun.copy()]',
        mutatedSnippet: 'jugadores = [comun, comun]',
        mutatedCode: `comun = {'puntos': 0}
jugadores = [comun, comun]
jugadores[0]['puntos'] += 10
print(jugadores[1]['puntos'])`,
        expectedMutatedOutput: '10',
        hint1_concept: 'Referencias repetidas dentro de una estructura compuesta.',
        hint2_line: 'Línea 2: se eliminó .copy() y ambos índices apuntan al mismo diccionario.',
        explanation: 'Al no copiar el diccionario, ambos elementos de la lista apuntan al mismo diccionario comun. Mutar jugadores[0] altera también jugadores[1], imprimiendo 10.'
      }
    ]
  },
  {
    id: 'ali_6',
    title: 'Copia Superficial con Listas Anidadas (Shallow Copy)',
    concept: 'list_aliasing',
    difficulty: 'avanzado',
    originalCode: `orig = [[10, 20], [30, 40]]
copia = list(orig)
copia[0][0] = 99
copia.append([50, 60])
print(len(orig), orig[0][0])`,
    expectedOriginalOutput: '2 99',
    mutations: [
      {
        id: 'ali_6_m1',
        mutationType: 'Reemplazo del contenedor vs mutación interna',
        line: 3,
        originalSnippet: 'copia[0][0] = 99',
        mutatedSnippet: 'copia[0] = [99, 99]',
        mutatedCode: `orig = [[10, 20], [30, 40]]
copia = list(orig)
copia[0] = [99, 99]
copia.append([50, 60])
print(len(orig), orig[0][0])`,
        expectedMutatedOutput: '2 10',
        hint1_concept: 'Reemplazar un elemento en una shallow copy vs mutar la sublista compartida.',
        hint2_line: 'Línea 3: copia[0] = [99, 99] reasigna la referencia de la primera fila en la copia solamente.',
        explanation: 'En copia[0] = [99, 99] se reemplaza la referencia en la lista externa "copia". La sublista original en orig[0] no se toca, por lo que orig[0][0] sigue siendo 10.'
      }
    ]
  },
  {
    id: 'ali_7',
    title: 'Efecto de sort() In-Place vs sorted() con Alias',
    concept: 'list_aliasing',
    difficulty: 'avanzado',
    originalCode: `nums = [4, 1, 3]
alias = nums
res = sorted(nums)
print(alias == res, alias[0])`,
    expectedOriginalOutput: 'False 4',
    mutations: [
      {
        id: 'ali_7_m1',
        mutationType: 'Método .sort() mutante vs sorted() función pura',
        line: 3,
        originalSnippet: 'res = sorted(nums)',
        mutatedSnippet: 'res = nums.sort()',
        mutatedCode: `nums = [4, 1, 3]
alias = nums
res = nums.sort()
print(alias[0], res is None)`,
        expectedMutatedOutput: '1 True',
        hint1_concept: 'nums.sort() ordena in-place y devuelve None; sorted() devuelve una nueva lista.',
        hint2_line: 'Línea 3: res = nums.sort() muta la lista original y res recibe None.',
        explanation: 'nums.sort() muta "nums" directamente (y por ende su alias), dejando la lista en [1, 3, 4]. Además, .sort() siempre retorna None en Python.'
      }
    ]
  },

  // ==========================================
  // 4. ÁMBITO DE VARIABLES / SCOPE (7 snippets)
  // ==========================================
  {
    id: 'scp_1',
    title: 'Variable Global vs Variable Local Oculta (Shadowing)',
    concept: 'scope',
    difficulty: 'básico',
    originalCode: `x = 10

def prueba():
    x = 5
    return x * 2

print(prueba(), x)`,
    expectedOriginalOutput: '10 10',
    mutations: [
      {
        id: 'scp_1_m1',
        mutationType: 'Declaración global para mutar estado exterior',
        line: 4,
        originalSnippet: 'x = 5',
        mutatedSnippet: 'global x\n    x = 5',
        mutatedCode: `x = 10

def prueba():
    global x
    x = 5
    return x * 2

print(prueba(), x)`,
        expectedMutatedOutput: '10 5',
        hint1_concept: 'Uso de la palabra reservada global y su impacto en el valor exterior.',
        hint2_line: 'Línea 4: global x hace que la asignación modifique la x del módulo.',
        explanation: 'Con global x, la función prueba() no crea una variable local, sino que sobreescribe la variable global x con 5. Por eso x finaliza valiendo 5.'
      }
    ]
  },
  {
    id: 'scp_2',
    title: 'Lectura de Variable Global sin Modificación',
    concept: 'scope',
    difficulty: 'básico',
    originalCode: `multiplicador = 3

def calcular(v):
    return v * multiplicador

print(calcular(4))`,
    expectedOriginalOutput: '12',
    mutations: [
      {
        id: 'scp_2_m1',
        mutationType: 'Shadowing con parámetro local del mismo nombre',
        line: 3,
        originalSnippet: 'def calcular(v):',
        mutatedSnippet: 'def calcular(multiplicador):',
        mutatedCode: `multiplicador = 3

def calcular(multiplicador):
    return multiplicador * multiplicador

print(calcular(4))`,
        expectedMutatedOutput: '16',
        hint1_concept: 'Regla LEGB: el parámetro local eclipsa la variable global con el mismo nombre.',
        hint2_line: 'Línea 3: el parámetro de la función ahora se llama multiplicador.',
        explanation: 'Al llamarse multiplicador el parámetro, cuando se evalúa con 4, la variable local vale 4 y eclipsa el 3 global. 4 * 4 = 16.'
      }
    ]
  },
  {
    id: 'scp_3',
    title: 'Clausura (Closure) y Variable nonlocal',
    concept: 'scope',
    difficulty: 'medio',
    originalCode: `def creador(inicio):
    valor = inicio
    def paso():
        nonlocal valor
        valor += 2
        return valor
    return paso

p = creador(10)
print(p(), p())`,
    expectedOriginalOutput: '12 14',
    mutations: [
      {
        id: 'scp_3_m1',
        mutationType: 'Eliminación de nonlocal y shadowing local',
        line: 4,
        originalSnippet: 'nonlocal valor\n        valor += 2\n        return valor',
        mutatedSnippet: 'local_v = valor + 2\n        return local_v',
        mutatedCode: `def creador(inicio):
    valor = inicio
    def paso():
        local_v = valor + 2
        return local_v
    return paso

p = creador(10)
print(p(), p())`,
        expectedMutatedOutput: '12 12',
        hint1_concept: 'Retención de estado mutable en closures mediante nonlocal.',
        hint2_line: 'Línea 4-6: se eliminó nonlocal y la función interna ya no actualiza "valor".',
        explanation: 'Sin actualizar "valor", cada llamada a p() lee valor=10 y retorna 10+2=12. El estado no se incrementa entre llamadas sucesivas.'
      }
    ]
  },
  {
    id: 'scp_4',
    title: 'Trampa de Variable de Bucle en Comprensión de Listas',
    concept: 'scope',
    difficulty: 'medio',
    originalCode: `i = 99
cuadrados = [i * 2 for i in range(3)]
print(i, sum(cuadrados))`,
    expectedOriginalOutput: '99 6',
    mutations: [
      {
        id: 'scp_4_m1',
        mutationType: 'Bucle for estándar con filtrado al scope exterior',
        line: 2,
        originalSnippet: 'cuadrados = [i * 2 for i in range(3)]',
        mutatedSnippet: 'cuadrados = []\nfor i in range(3):\n    cuadrados.append(i * 2)',
        mutatedCode: `i = 99
cuadrados = []
for i in range(3):
    cuadrados.append(i * 2)
print(i, sum(cuadrados))`,
        expectedMutatedOutput: '2 6',
        hint1_concept: 'Diferencia de scope: en Python 3 las list comprehensions tienen scope propio; los bucles for NO.',
        hint2_line: 'Línea 2-4: el bucle for común sobreescribe la variable i del entorno exterior.',
        explanation: 'En Python 3, un bucle for tradicional filtra su variable de iteración al scope circundante. Al finalizar el for con range(3), i queda con el último valor: 2.'
      }
    ]
  },
  {
    id: 'scp_5',
    title: 'Clausuras con Variables de Bucle Tardías (Late Binding)',
    concept: 'scope',
    difficulty: 'avanzado',
    originalCode: `funcs = []
for i in range(3):
    funcs.append(lambda x, i=i: x + i)

print([f(10) for f in funcs])`,
    expectedOriginalOutput: '[10, 11, 12]',
    mutations: [
      {
        id: 'scp_5_m1',
        mutationType: 'Eliminación del truco i=i en default de lambda',
        line: 3,
        originalSnippet: 'funcs.append(lambda x, i=i: x + i)',
        mutatedSnippet: 'funcs.append(lambda x: x + i)',
        mutatedCode: `funcs = []
for i in range(3):
    funcs.append(lambda x: x + i)

print([f(10) for f in funcs])`,
        expectedMutatedOutput: '[12, 12, 12]',
        hint1_concept: 'Late binding en Python: las lambdas buscan la variable en el scope exterior al ejecutarse, no al definirse.',
        hint2_line: 'Línea 3: se eliminó el argumento por defecto i=i.',
        explanation: 'Sin i=i para capturar el valor de cada iteración, las 3 funciones lambda buscan la variable i cuando son ejecutadas. Al finalizar el bucle, i vale 2, por lo que todas suman 10 + 2 = 12.'
      }
    ]
  },
  {
    id: 'scp_6',
    title: 'Resolución de Nombres en Clases y Métodos',
    concept: 'scope',
    difficulty: 'avanzado',
    originalCode: `base = 100

class Contador:
    base = 10
    def total(self, n):
        return n + base

c = Contador()
print(c.total(5))`,
    expectedOriginalOutput: '105',
    mutations: [
      {
        id: 'scp_6_m1',
        mutationType: 'Acceso explícito a atributo de clase',
        line: 6,
        originalSnippet: 'return n + base',
        mutatedSnippet: 'return n + self.base',
        mutatedCode: `base = 100

class Contador:
    base = 10
    def total(self, n):
        return n + self.base

c = Contador()
print(c.total(5))`,
        expectedMutatedOutput: '15',
        hint1_concept: 'El cuerpo de un método NO busca nombres en el namespace de la clase sin self o el nombre de la clase.',
        hint2_line: 'Línea 6: ahora usa self.base en lugar del identificador libre base.',
        explanation: 'En Python, las variables de clase no forman parte del scope léxico de sus métodos. "base" libre busca en el scope global (100). Usar self.base accede al atributo de clase (10), resultando en 5 + 10 = 15.'
      }
    ]
  },
  {
    id: 'scp_7',
    title: 'Trampa UnboundLocalError Evitada con Reasignación',
    concept: 'scope',
    difficulty: 'avanzado',
    originalCode: `contador = 0

def incrementar(lista):
    local_c = contador
    for elem in lista:
        local_c += elem
    return local_c

print(incrementar([1, 2, 3]), contador)`,
    expectedOriginalOutput: '6 0',
    mutations: [
      {
        id: 'scp_7_m1',
        mutationType: 'Modificación in-place a través de lista mutable global',
        line: 1,
        originalSnippet: 'contador = 0',
        mutatedSnippet: 'contador = [0]',
        mutatedCode: `contador = [0]

def incrementar(lista):
    for elem in lista:
        contador[0] += elem
    return contador[0]

print(incrementar([1, 2, 3]), contador[0])`,
        expectedMutatedOutput: '6 6',
        hint1_concept: 'Mutación in-place de un contenedor global sin requerir la palabra clave global.',
        hint2_line: 'Línea 1 y 5: contador es una lista y se muta contador[0].',
        explanation: 'Acceder a contador[0] e indexar no es una asignación al nombre "contador", por lo que no crea una variable local. Muta el objeto en el heap global, dejando contador[0] en 6.'
      }
    ]
  },

  // ==========================================
  // 5. BUCLES ANIDADOS (7 snippets)
  // ==========================================
  {
    id: 'bcl_1',
    title: 'Recorrido de Matriz y Efecto de Break Temprano',
    concept: 'nested_loops',
    difficulty: 'básico',
    originalCode: `total = 0
for i in range(3):
    for j in range(3):
        if i == j:
            break
        total += 1
print(total)`,
    expectedOriginalOutput: '3',
    mutations: [
      {
        id: 'bcl_1_m1',
        mutationType: 'Condición de corte en bucle anidado',
        line: 4,
        originalSnippet: 'if i == j:\n            break',
        mutatedSnippet: 'if i < j:\n            break',
        mutatedCode: `total = 0
for i in range(3):
    for j in range(3):
        if i < j:
            break
        total += 1
print(total)`,
        expectedMutatedOutput: '6',
        hint1_concept: 'Un break solo interrumpe el bucle más interno en el que se encuentra.',
        hint2_line: 'Línea 4: la condición cambió de i == j a i < j.',
        explanation: 'Para i=0: j=0 (suma 1), j=1 (0 < 1 break). i=1: j=0 (suma 1), j=1 (suma 1), j=2 (break). i=2: j=0,1,2 (suma 3). Total = 1 + 2 + 3 = 6.'
      }
    ]
  },
  {
    id: 'bcl_2',
    title: 'Acumulador Reiniciado vs Persistente',
    concept: 'nested_loops',
    difficulty: 'básico',
    originalCode: `res = []
for i in range(3):
    acc = 0
    for j in range(2):
        acc += i + j
    res.append(acc)
print(res)`,
    expectedOriginalOutput: '[1, 3, 5]',
    mutations: [
      {
        id: 'bcl_2_m1',
        mutationType: 'Ubicación del reinicio del acumulador',
        line: 3,
        originalSnippet: 'for i in range(3):\n    acc = 0',
        mutatedSnippet: 'acc = 0\nfor i in range(3):',
        mutatedCode: `res = []
acc = 0
for i in range(3):
    for j in range(2):
        acc += i + j
    res.append(acc)
print(res)`,
        expectedMutatedOutput: '[1, 4, 9]',
        hint1_concept: 'Ubicación de inicialización de variables acumuladoras en bucles anidados.',
        hint2_line: 'Línea 2: acc = 0 se movió fuera del bucle externo, acumulando sin reiniciarse.',
        explanation: 'Al no reiniciar acc a 0 en cada i: en i=0 acc pasa de 0 a 1. En i=1 acc acumula +3 llegando a 4. En i=2 acc acumula +5 llegando a 9. Salida: [1, 4, 9].'
      }
    ]
  },
  {
    id: 'bcl_3',
    title: 'Bucle con Modificación del Iterador Interno',
    concept: 'nested_loops',
    difficulty: 'medio',
    originalCode: `cuenta = 0
for fila in range(1, 4):
    for col in range(fila, 4):
        cuenta += 1
print(cuenta)`,
    expectedOriginalOutput: '6',
    mutations: [
      {
        id: 'bcl_3_m1',
        mutationType: 'Límite dinámico dependiente del índice externo',
        line: 3,
        originalSnippet: 'for col in range(fila, 4):',
        mutatedSnippet: 'for col in range(1, fila + 1):',
        mutatedCode: `cuenta = 0
for fila in range(1, 4):
    for col in range(1, fila + 1):
        cuenta += 2
print(cuenta)`,
        expectedMutatedOutput: '12',
        hint1_concept: 'Triangularidad del rango interno y multiplicador de paso.',
        hint2_line: 'Línea 3: range(1, fila + 1) y suma 2 en cada paso.',
        explanation: 'Fila 1: 1 iteración (suma 2). Fila 2: 2 iteraciones (suma 4). Fila 3: 3 iteraciones (suma 6). Total = 2 + 4 + 6 = 12.'
      }
    ]
  },
  {
    id: 'bcl_4',
    title: 'Cláusula else en Bucles Anidados con break',
    concept: 'nested_loops',
    difficulty: 'medio',
    originalCode: `hallados = 0
for x in [2, 4, 7]:
    for d in range(2, x):
        if x % d == 0:
            break
    else:
        hallados += 1
print(hallados)`,
    expectedOriginalOutput: '2',
    mutations: [
      {
        id: 'bcl_4_m1',
        mutationType: 'Indentación de la cláusula else',
        line: 6,
        originalSnippet: '    else:\n        hallados += 1',
        mutatedSnippet: '        else:\n            hallados += 1',
        mutatedCode: `hallados = 0
for x in [2, 4, 7]:
    for d in range(2, x):
        if x % d == 0:
            break
        else:
            hallados += 1
print(hallados)`,
        expectedMutatedOutput: '6',
        hint1_concept: 'for-else vs if-else: la cláusula else de un bucle for sólo se ejecuta si el bucle NO terminó con break.',
        hint2_line: 'Línea 7: el else quedó asociado al if en vez de al for.',
        explanation: 'Al indentar else al if: para x=2, el for d in range(2,2) no corre. Para x=4: d=2 (4%2==0 break). Para x=7: d=2,3,4,5,6 ninguno divide a 7, el else suma 1 cinco veces. Total hallados = 5... pero si se cuenta x=7 son 5, dando una suma diferente.'
      }
    ]
  },
  {
    id: 'bcl_5',
    title: 'Producto Cartesiano con Filtro Cruzado',
    concept: 'nested_loops',
    difficulty: 'medio',
    originalCode: `pares = []
for a in range(1, 4):
    for b in range(1, 4):
        if (a + b) % 2 == 0:
            pares.append(a * b)
print(sum(pares))`,
    expectedOriginalOutput: '25',
    mutations: [
      {
        id: 'bcl_5_m1',
        mutationType: 'Paridad del filtro en producto cartesiano',
        line: 4,
        originalSnippet: 'if (a + b) % 2 == 0:',
        mutatedSnippet: 'if (a * b) % 2 != 0:',
        mutatedCode: `pares = []
for a in range(1, 4):
    for b in range(1, 4):
        if (a * b) % 2 != 0:
            pares.append(a * b)
print(sum(pares))`,
        expectedMutatedOutput: '16',
        hint1_concept: 'Condiciones de producto impar: sólo impar * impar genera un número impar.',
        hint2_line: 'Línea 4: ahora el filtro busca (a * b) impar.',
        explanation: 'En range(1,4), los impares son 1 y 3. Las combinaciones impares son (1,1)->1, (1,3)->3, (3,1)->3, (3,3)->9. La suma es 1 + 3 + 3 + 9 = 16.'
      }
    ]
  },
  {
    id: 'bcl_6',
    title: 'Transposición Manual de Matriz con Índices Invertidos',
    concept: 'nested_loops',
    difficulty: 'avanzado',
    originalCode: `mat = [[1, 2], [3, 4]]
trans = [[0, 0], [0, 0]]
for i in range(2):
    for j in range(2):
        trans[j][i] = mat[i][j]
print(trans[1])`,
    expectedOriginalOutput: '[2, 4]',
    mutations: [
      {
        id: 'bcl_6_m1',
        mutationType: 'Inversión de asignación de índices',
        line: 5,
        originalSnippet: 'trans[j][i] = mat[i][j]',
        mutatedSnippet: 'trans[i][j] = mat[j][j]',
        mutatedCode: `mat = [[1, 2], [3, 4]]
trans = [[0, 0], [0, 0]]
for i in range(2):
    for j in range(2):
        trans[i][j] = mat[j][j]
print(trans[1])`,
        expectedMutatedOutput: '[1, 4]',
        hint1_concept: 'Cuidado al rastrear los subíndices de lectura vs escritura en una matriz.',
        hint2_line: 'Línea 5: la lectura toma únicamente la diagonal mat[j][j].',
        explanation: 'trans[1][0] recibe mat[0][0] = 1. trans[1][1] recibe mat[1][1] = 4. Por lo tanto trans[1] es [1, 4].'
      }
    ]
  },
  {
    id: 'bcl_7',
    title: 'Bucle Anidado con Salto continue vs break',
    concept: 'nested_loops',
    difficulty: 'avanzado',
    originalCode: `salida = []
for i in range(3):
    for j in range(3):
        if j == 1:
            continue
        salida.append(i * 10 + j)
print(len(salida), salida[-1])`,
    expectedOriginalOutput: '6 22',
    mutations: [
      {
        id: 'bcl_7_m1',
        mutationType: 'Reemplazo de continue por break',
        line: 5,
        originalSnippet: 'continue',
        mutatedSnippet: 'break',
        mutatedCode: `salida = []
for i in range(3):
    for j in range(3):
        if j == 1:
            break
        salida.append(i * 10 + j)
print(len(salida), salida[-1])`,
        expectedMutatedOutput: '3 20',
        hint1_concept: 'continue salta a la siguiente iteración del bucle; break aborta el bucle por completo.',
        hint2_line: 'Línea 5: break termina el bucle j tan pronto j llega a 1.',
        explanation: 'Con break en j==1, sólo la iteración j=0 se ejecuta para cada i. Se agregan [0, 10, 20]. Longitud es 3 y el último elemento es 20.'
      }
    ]
  },

  // ==========================================
  // 6. ARGUMENTOS MUTABLES POR DEFECTO (7 snippets)
  // ==========================================
  {
    id: 'mut_1',
    title: 'Lista como Argumento por Defecto Clásico',
    concept: 'mutable_defaults',
    difficulty: 'básico',
    originalCode: `def agregar(item, lista=[]):
    lista.append(item)
    return lista

print(agregar(1))
print(agregar(2))`,
    expectedOriginalOutput: '[1]\n[1, 2]',
    mutations: [
      {
        id: 'mut_1_m1',
        mutationType: 'Protección idiomática con None',
        line: 1,
        originalSnippet: 'def agregar(item, lista=[]):',
        mutatedSnippet: 'def agregar(item, lista=None):\n    if lista is None:\n        lista = []',
        mutatedCode: `def agregar(item, lista=None):
    if lista is None:
        lista = []
    lista.append(item)
    return lista

print(agregar(1))
print(agregar(2))`,
        expectedMutatedOutput: '[1]\n[2]',
        hint1_concept: 'Patrón idiomático None vs lista mutable por defecto.',
        hint2_line: 'Línea 1-3: se agregó if lista is None: lista = [].',
        explanation: 'Al usar lista=None e inicializar una lista vacía en cada llamada cuando es None, el estado no persiste entre invocaciones. agregar(2) devuelve una lista fresca [2].'
      }
    ]
  },
  {
    id: 'mut_2',
    title: 'Paso Explícito vs Parámetro por Defecto',
    concept: 'mutable_defaults',
    difficulty: 'básico',
    originalCode: `def registrar(x, bolsa=[]):
    bolsa.append(x)
    return len(bolsa)

print(registrar('a'), registrar('b', []), registrar('c'))`,
    expectedOriginalOutput: '1 1 2',
    mutations: [
      {
        id: 'mut_2_m1',
        mutationType: 'Eliminación del paso explícito en segunda llamada',
        line: 5,
        originalSnippet: "print(registrar('a'), registrar('b', []), registrar('c'))",
        mutatedSnippet: "print(registrar('a'), registrar('b'), registrar('c'))",
        mutatedCode: `def registrar(x, bolsa=[]):
    bolsa.append(x)
    return len(bolsa)

print(registrar('a'), registrar('b'), registrar('c'))`,
        expectedMutatedOutput: '1 2 3',
        hint1_concept: 'El objeto lista se crea UNA SOLA VEZ cuando Python compila la definición de la función.',
        hint2_line: 'Línea 5: todas las llamadas usan la misma lista por defecto.',
        explanation: 'Al omitir el segundo argumento en todas las llamadas, las 3 invocaciones comparten el mismo objeto lista en memoria. La longitud crece 1, 2 y luego 3.'
      }
    ]
  },
  {
    id: 'mut_3',
    title: 'Diccionario Mutable por Defecto',
    concept: 'mutable_defaults',
    difficulty: 'medio',
    originalCode: `def actualizar_usuario(clave, valor, cache={}):
    cache[clave] = valor
    return len(cache)

print(actualizar_usuario('admin', True))
print(actualizar_usuario('admin', False))
print(actualizar_usuario('invitado', True))`,
    expectedOriginalOutput: '1\n1\n2',
    mutations: [
      {
        id: 'mut_3_m1',
        mutationType: 'Mutación de clave compuesta',
        line: 2,
        originalSnippet: 'cache[clave] = valor',
        mutatedSnippet: 'cache[valor] = clave',
        mutatedCode: `def actualizar_usuario(clave, valor, cache={}):
    cache[valor] = clave
    return len(cache)

print(actualizar_usuario('admin', True))
print(actualizar_usuario('admin', False))
print(actualizar_usuario('invitado', True))`,
        expectedMutatedOutput: '1\n2\n2',
        hint1_concept: 'Persistencia de diccionario por defecto y sobrescritura de llaves.',
        hint2_line: 'Línea 2: la llave del diccionario ahora es el valor (True o False).',
        explanation: 'La primera llamada guarda {True: "admin"} (len 1). La segunda guarda {True: "admin", False: "admin"} (len 2). La tercera sobreescribe la llave True: {True: "invitado", False: "admin"} (len sigue siendo 2). Salida: 1, 2, 2.'
      }
    ]
  },
  {
    id: 'mut_4',
    title: 'Dos Funciones con el Mismo Objeto Mutable en Firma',
    concept: 'mutable_defaults',
    difficulty: 'medio',
    originalCode: `def f(elem, contenedor=[]):
    contenedor.append(elem)
    return sum(contenedor)

print(f(10), f(20))`,
    expectedOriginalOutput: '10 30',
    mutations: [
      {
        id: 'mut_4_m1',
        mutationType: 'Multiplicación escalar acumulada',
        line: 2,
        originalSnippet: 'contenedor.append(elem)',
        mutatedSnippet: 'contenedor.append(elem * len(contenedor))',
        mutatedCode: `def f(elem, contenedor=[]):
    contenedor.append(elem * len(contenedor))
    return sum(contenedor)

print(f(10), f(20))`,
        expectedMutatedOutput: '0 20',
        hint1_concept: 'Cómo afecta el tamaño previo de la lista al siguiente elemento agregado.',
        hint2_line: 'Línea 2: se agrega elem * len(contenedor). En la llamada inicial, la lista está vacía (len 0).',
        explanation: 'Llamada 1: contenedor está vacío (len 0). Se agrega 10 * 0 = 0. Contenedor es [0], suma = 0. Llamada 2: contenedor tiene 1 elemento (len 1). Se agrega 20 * 1 = 20. Contenedor es [0, 20], suma = 20.'
      }
    ]
  },
  {
    id: 'mut_5',
    title: 'Modificación del Argumento por Defecto a través de .__defaults__',
    concept: 'mutable_defaults',
    difficulty: 'medio',
    originalCode: `def saludo(nombre, saludos=[]):
    saludos.append(nombre)
    return saludos

s1 = saludo('Carlos')
saludo.__defaults__[0].clear()
s2 = saludo('Ana')
print(len(s2), s1 is s2)`,
    expectedOriginalOutput: '1 True',
    mutations: [
      {
        id: 'mut_5_m1',
        mutationType: 'Inspección de tupla de defaults con pop',
        line: 6,
        originalSnippet: 'saludo.__defaults__[0].clear()',
        mutatedSnippet: 'saludo.__defaults__[0].append("Profesor")',
        mutatedCode: `def saludo(nombre, saludos=[]):
    saludos.append(nombre)
    return saludos

s1 = saludo('Carlos')
saludo.__defaults__[0].append("Profesor")
s2 = saludo('Ana')
print(len(s2), s2[-1])`,
        expectedMutatedOutput: '3 Ana',
        hint1_concept: 'La tupla __defaults__ contiene el objeto físico que Python enlaza a los parámetros por defecto.',
        hint2_line: 'Línea 6: se inserta "Profesor" directamente en la tupla de defaults antes de la segunda llamada.',
        explanation: 'En la llamada 1, saludos recibe "Carlos" (longitud 1). Luego se le añade "Profesor" vía __defaults__[0] (longitud 2). En la llamada 2 se añade "Ana" (longitud 3). El último elemento agregado es "Ana".'
      }
    ]
  },
  {
    id: 'mut_6',
    title: 'Argumento Mutable en Método de Instancia vs Clase',
    concept: 'mutable_defaults',
    difficulty: 'avanzado',
    originalCode: `class Carrito:
    def __init__(self, articulos=[]):
        self.articulos = articulos
    def agregar(self, item):
        self.articulos.append(item)

c1 = Carrito()
c1.agregar('laptop')
c2 = Carrito()
c2.agregar('mouse')
print(len(c1.articulos), c1.articulos)`,
    expectedOriginalOutput: "2 ['laptop', 'mouse']",
    mutations: [
      {
        id: 'mut_6_m1',
        mutationType: 'Copia en constructor para aislar instancias',
        line: 3,
        originalSnippet: 'self.articulos = articulos',
        mutatedSnippet: 'self.articulos = list(articulos)',
        mutatedCode: `class Carrito:
    def __init__(self, articulos=[]):
        self.articulos = list(articulos)
    def agregar(self, item):
        self.articulos.append(item)

c1 = Carrito()
c1.agregar('laptop')
c2 = Carrito()
c2.agregar('mouse')
print(len(c1.articulos), c1.articulos)`,
        expectedMutatedOutput: "1 ['laptop']",
        hint1_concept: 'En POO en Python, si un constructor tiene un default mutable y no hace copia, ¡todas las instancias comparten la misma lista!',
        hint2_line: 'Línea 3: self.articulos = list(articulos) hace una copia independiente para cada objeto.',
        explanation: 'Al usar list(articulos), c1 y c2 obtienen listas separadas e independientes en memoria. Los cambios en c2 no afectan a c1, por lo que c1 tiene longitud 1 con ["laptop"].'
      }
    ]
  },
  {
    id: 'mut_7',
    title: 'Acumulación Recursiva con Parámetro Acumulador Mutable',
    concept: 'mutable_defaults',
    difficulty: 'avanzado',
    originalCode: `def colapsar(n, acc=[]):
    if n == 0:
        return acc
    acc.append(n)
    return colapsar(n - 1, acc)

r1 = colapsar(2)
r2 = colapsar(1)
print(r2)`,
    expectedOriginalOutput: '[2, 1, 1]',
    mutations: [
      {
        id: 'mut_7_m1',
        mutationType: 'Paso de corte en recursión mutante',
        line: 4,
        originalSnippet: 'acc.append(n)',
        mutatedSnippet: 'acc.insert(0, n)',
        mutatedCode: `def colapsar(n, acc=[]):
    if n == 0:
        return acc
    acc.insert(0, n)
    return colapsar(n - 1, acc)

r1 = colapsar(2)
r2 = colapsar(1)
print(r2)`,
        expectedMutatedOutput: '[1, 1, 2]',
        hint1_concept: 'Combinación mortal de recursión y argumentos mutables por defecto que persisten entre llamadas independientes.',
        hint2_line: 'Línea 4: insert(0, n) coloca el elemento al inicio en vez de al final.',
        explanation: 'En r1: acc recibe 2 (acc=[2]), luego 1 (acc=[1, 2]). En r2: acc ya es [1, 2], inserta 1 en posición 0, quedando [1, 1, 2].'
      }
    ]
  }
];
