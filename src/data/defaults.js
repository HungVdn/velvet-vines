export const WILD_CARDS_DEFAULT = [
    { type: 'Luật chơi', text: 'Nhấp môi Quý ông: Mỗi khi nam giới uống, họ phải nâng ly chúc mừng các quý cô sang trọng trong phòng.' },
    { type: 'Thử thách', text: 'Chuyên gia nếm rượu: Hãy bịt mắt và đoán đồ uống của người bên trái bạn. Nếu đoán sai, nhấp 2 hơi.' },
    { type: 'Nhấp môi', text: 'Giao lưu: Mọi người cùng nâng ly và nhấp một hơi.' },
    { type: 'Luật chơi', text: 'Sự im lặng là Vàng: Không ai được nói từ "Uống" hoặc "Nhấp". Vi phạm sẽ phải nhấp 1 hơi.' },
    { type: 'Thử thách', text: 'Giọng nói Nhung lụa: Nói bằng tông giọng "sang chảnh" nhất của bạn trong 3 vòng tới.' },
    { type: 'Nhấp môi', text: 'Thác đổ: Bắt đầu uống; người bên trái bạn không được dừng lại cho đến khi bạn dừng, và cứ thế tiếp tục.' },
    { type: 'Luật chơi', text: 'Ga lăng: Bạn phải kéo ghế cho bất kỳ ai đứng dậy. Quên ư? Nhấp môi.' },
    { type: 'Thử thách', text: 'Kẻ sành sỏi: Thuyết phục mọi người trong 30 giây tại sao bạn nên là "VIP của đêm nay".' },
]

export const TRUTH_OR_DARE_DEFAULT = [
    { "id": 1, "type": "truth", "content": "Bạn đã bao giờ tè dầm khi đã lớn chưa? Khi nào?" },
    { "id": 2, "type": "truth", "content": "Nếu được phẫu thuật thẩm mỹ miễn phí, bạn sẽ sửa gì trên mặt?" },
    { "id": 3, "type": "truth", "content": "Bạn đã bao giờ không tắm quá 3 ngày chưa?" },
    { "id": 4, "type": "truth", "content": "Món ăn kinh dị nhất bạn từng bỏ vào miệng là gì?" },
    { "id": 5, "type": "truth", "content": "Bạn sợ con gì nhất?" },
    { "id": 51, "type": "dare", "content": "Hít đất 20 cái ngay lập tức." },
    { "id": 52, "type": "dare", "content": "Plank trong 60 giây." },
    { "id": 53, "type": "dare", "content": "Múa cột (sử dụng một người hoặc cái cây/cột nhà làm cột)." },
    { "id": 54, "type": "dare", "content": "Vừa ngậm nước trong mồm vừa hát một bài." },
    { "id": 55, "type": "dare", "content": "Để người bên phải vẽ một con rùa lên tay bạn bằng bút bi/dạ." }
]

export const SPOTLIGHT_DEFAULT = [
    { content: "Ai có khả năng sẽ bao cả bàn nhất?" },
    { content: "Ai có khả năng sẽ là người đầu tiên nhảy nhót?" },
    { content: "Ai có khả năng sẽ quên thanh toán hóa đơn vào cuối buổi nhất?" },
    { content: "Ai có khả năng sẽ là người lái xe hộ (tỉnh táo nhất)?" },
    { content: "Ai có khả năng sẽ bắt đầu màn nâng ly chúc mừng?" },
]

export const TRIVIA_DEFAULT = [
    { q: "Loại cocktail nào được làm từ rượu gin, nước chanh, đường và nước có ga?", a1: "Tom Collins", a2: "Gin Fizz", a3: "Negroni", a4: "Martini", correct: 0 },
    { q: "Thành phần chính của rượu Sake Nhật Bản là gì?", a1: "Lúa mì", a2: "Khoai tây", a3: "Gạo", a4: "Lúa mạch", correct: 2 },
    { q: "Rượu Mojito có nguồn gốc từ quốc gia nào?", a1: "Mexico", a2: "Cuba", a3: "Brazil", a4: "Tây Ban Nha", correct: 1 },
    { q: "Loại rượu nào được mệnh danh là 'Nàng Tiên Xanh'?", a1: "Chartreuse", a2: "Midori", a3: "Absinthe", a4: "Jägermeister", correct: 2 },
    { q: "Thể tích tiêu chuẩn của một chai rượu vang (ml) là bao nhiêu?", a1: "500ml", a2: "700ml", a3: "750ml", a4: "1000ml", correct: 2 },
]

export const GAME_SCHEMAS = {
    'wild-cards': [
        {
            name: 'type', label: 'Loại', type: 'select', options: [
                { label: 'Luật chơi', value: 'Luật chơi' },
                { label: 'Thử thách', value: 'Thử thách' },
                { label: 'Nhấp môi', value: 'Nhấp môi' }
            ], default: 'Luật chơi'
        },
        { name: 'text', label: 'Nội dung', type: 'textarea' }
    ],
    'truth-or-dare': [
        {
            name: 'type', label: 'Loại', type: 'select', options: [
                { label: 'Sự thật', value: 'truth' },
                { label: 'Thách thức', value: 'dare' },
                { label: 'Nhấp môi', value: 'drink' }
            ], default: 'truth'
        },
        { name: 'content', label: 'Nội dung', type: 'textarea' }
    ],
    'spotlight': [
        { name: 'content', label: 'Câu hỏi', type: 'textarea' }
    ],
    'trivia': [
        { name: 'q', label: 'Câu hỏi', type: 'textarea' },
        { name: 'a1', label: 'Đáp án 1', type: 'text' },
        { name: 'a2', label: 'Đáp án 2', type: 'text' },
        { name: 'a3', label: 'Đáp án 3', type: 'text' },
        { name: 'a4', label: 'Đáp án 4', type: 'text' },
        { name: 'correct', label: 'Đáp án đúng (0-3)', type: 'text', default: '0' }
    ]
}
