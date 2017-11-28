Бекенд максимально тупий, перевірка на наявність слів в словнику, повна перевірка всього тексту при любій зміні.

# Фронтенд

код не найкращий, не рефакторив майже, декомпозиція порушуєтьсся.


## Intervals:

- є зміщення інтервалів
- немає багато логіки, яка є у вас (наприклад сабміт слова тільки після закінчення вводу)
- є поправка на інтервал у випадку:
  1) відправили на Бекенд
  2) змінили текст
  3) отримали правку з бекенду <- зміщуєм


## Вузькі місця

1) https://gitlab.com/goloveychuk/editor/blob/master/frontend/src/models/index.ts#L110-149


- add() і remove() можна легко написати O(log(n)) i O(1) (linked list)
- offset() - зараз O(n) для одного diff (обично він один). В теорії можна зробити Log n (див. нижче Offset Tree)



2) https://gitlab.com/goloveychuk/editor/blob/master/frontend/src/models/index.ts#L211-240
зараз O(n) для любої зміни в text, cursor position, inspections
    
- можна уникнути перерахункупри зміні cursor positions (зберігати текст ноди як атоми, робити точечну зміну)
- можна спробувати, знаючи які inspections додались або видались, змінювати сусідні ноди.
    


## рендерінг

Зараз юзаю React + focal. В основному рендерінг дешевий, міняється декілька нод за раз. 

Но у випадку коли є добавлення або видалення ноди, всі ноди після нової міняють свій індекс. 

https://gitlab.com/goloveychuk/editor/blob/master/frontend/src/views/editor/view.tsx

Це не проблема для NodeView. Но проблема для HTML text node.

Скажем є ['hey', 'lol', 'car']. Якщо вставити нову ноду посередині, реакт не розуміє шо можна просто вставити її. Він ререндерить всі і добавляє нову вкінці.

Пофіксити можна:
- не юзати HTML Text Node, а рендерити span з незмінним key. 
- не юзати React (див далі. Асинхронний рендерінг)
- форкнути react-dom і додати оптимізацію.


В цілому лагів не помічаю. Я додав debouncer на бекенд, щоб не просідало коли приходять підряд багато відповідей які міняють стейт.

Але можливо лаги будуть на старих пк. 

Тоді вирішення:
- не рендерити те що не попадає у view. 
- хоча б щоб інпут не лагав - рендерити асинхронно.



## Асинхронний рендерінг
Судячи по тому що у вас є деяке відставання зміщення підкреслення якщо зажати пробіл - рендерите асинхронно.
Наскільки я розумію - з реактом так не вийде. Треба щоб реакт дав можливість бути перерваним.

Шляхи вирішення:
- написати свій рендерер для оверлея (де перформанс найважливіший). 
- актуально зараз - глянути бету нового реакта

Ніколи не писав асинхронних рендерів, но уявляю це як:

відрендирили частину, перервались, глянули чи юзер шось хоче, обробили, вернулись, змерджили чергу змін (якщо є перекриваючі зміни), продовжили.



## Offset tree

https://gitlab.com/goloveychuk/editor/blob/master/frontend/src/lib/tree.ts

disclaimer: думаю, все це несе виключно академічну цінність, і якийсь профіт буде з 10000 нод (на практиці ніколи). Думаю webkit з деревами працює набагато довше ніж з массивами.
Плюс webkit після якоїсь кількості ітерацій оптимізовує цикли в плюсовий код, з дереваами в нього наврядчи вийде.

Якщо коротко: бінарне дерево, вузли - відносне зміщення індекса від батьківського. Для рута - від початку (тобто індекс).

http://take.ms/xjBP5

Це я почав робити. Шось похоже, тільки тут бється по буквам. 

Спачатку була ідея бити зразу речення на ноди, зберігати значення у вузлах. Але заімплементити важко, особливо коли є зміна діапазону тексту в який входить декілька нод. Того не продовжив.

Профіт:
- видалення лог н
- добавлення лог н
- зміщення лог н

Мінуси:
- якщо треба знати start, end: багато арифметичних операцій
- повільно для хрома (думаю, не тестив)
- память
- складно імплементити, змінювати, баги

Короче фігова ідея, хз нашо я її описав)