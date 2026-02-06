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

export const DEEP_SECRETS_DEFAULT = [
    { type: 'Chia sẻ', text: 'Hãy kể về một lần bạn cảm thấy tự hào nhất về bản thân trong năm qua.' },
    { type: 'Bí mật', text: 'Điều gì là nỗi sợ lớn nhất của bạn mà ít người biết đến?' },
    { type: 'Kỷ niệm', text: 'Món quà ý nghĩa nhất bạn từng nhận được là gì và tại sao?' },
    { type: 'Chia sẻ', text: 'Nếu được quay lại quá khứ để thay đổi một quyết định, đó sẽ là gì?' },
    { type: 'Bí mật', text: 'Tật xấu đáng yêu nhất của bạn là gì?' },
    { type: 'Kỷ niệm', text: 'Lần cuối cùng bạn khóc vì hạnh phúc là khi nào?' }
]

export const TRIVIA_DEFAULT = {
    "Văn hóa Nhậu": {
        1: [
            { q: "Loại rượu nào thường được dùng để pha Mojito?", a1: "Rum", a2: "Vodka", a3: "Gin", a4: "Tequila", correct: 0 },
            { q: "Thành phần không thể thiếu trong Gin & Tonic là?", a1: "Nước chanh", a2: "Nước Tonic", a3: "Siro dâu", a4: "Nước khoáng", correct: 1 }
        ],
        2: [
            { q: "Cocktail 'Old Fashioned' sử dụng loại rượu nền nào?", a1: "Bourbon/Rye Whiskey", a2: "Scotch", a3: "Cognac", a4: "Rum", correct: 0 },
            { q: "Quốc gia nào nổi tiếng nhất với bia Guinness?", a1: "Anh", a2: "Đức", a3: "Ireland", a4: "Bỉ", correct: 2 }
        ],
        3: [
            { q: "Loại rượu nào được mệnh danh là 'Nàng Tiên Xanh'?", a1: "Absinthe", a2: "Chartreuse", a3: "Midori", a4: "Cointreau", correct: 0 },
            { q: "IBA (International Bartenders Association) công nhận bao nhiêu loại cocktail chính thức?", a1: "77", a2: "90", a3: "65", a4: "100", correct: 0 }
        ]
    },
    "Kiến thức Đời sống": {
        1: [
            { q: "Hành tinh nào gần Mặt trời nhất?", a1: "Sao Kim", a2: "Sao Thủy", a3: "Sao Hỏa", a4: "Trái Đất", correct: 1 },
            { q: "Màu nào sau đây không có trong cầu vồng?", a1: "Đỏ", a2: "Tím", a3: "Hồng", a4: "Xanh lá", correct: 2 }
        ],
        2: [
            { q: "Ai là tác giả của tiểu thuyết 'Sherlock Holmes'?", a1: "Agatha Christie", a2: "Arthur Conan Doyle", a3: "J.K. Rowling", a4: "Stephen King", correct: 1 },
            { q: "Nguyên tố hóa học có ký hiệu là Au?", a1: "Bạc", a2: "Đồng", a3: "Sắt", a4: "Vàng", correct: 3 }
        ],
        3: [
            { q: "Quốc gia nào có diện tích lớn nhất thế giới?", a1: "Canada", a2: "Mỹ", a3: "Nga", a4: "Trung Quốc", correct: 2 },
            { q: "Tác phẩm 'Mona Lisa' của ai?", a1: "Picasso", a2: "Van Gogh", a3: "Leonardo da Vinci", a4: "Rembrandt", correct: 2 }
        ]
    },
    "Bí mật Velvet": {
        1: [
            { q: "Màu chủ đạo của Velvet Vines là gì?", a1: "Đỏ đô & Vàng", a2: "Xanh & Bạc", a3: "Đen & Trắng", a4: "Tím & Vàng", correct: 0 }
        ],
        2: [
            { q: "Biểu tượng của Velvet Vines là gì?", a1: "Con Rồng", a2: "Ouroboros (Rắn cắn đuôi)", a3: "Phượng Hoàng", a4: "Sử Tử", correct: 1 }
        ],
        3: [
            { q: "Phong cách thiết kế của Velvet Vines hướng tới điều gì?", a1: "Cổ điển & Ma mị", a2: "Hiện đại & Tối giản", a3: "Dễ thương & Nhộn nhịp", a4: "Futuristic", correct: 0 }
        ]
    }
}

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
    ],
    'deep-secrets': [
        {
            name: 'type', label: 'Loại', type: 'select', options: [
                { label: 'Chia sẻ', value: 'Chia sẻ' },
                { label: 'Bí mật', value: 'Bí mật' },
                { label: 'Kỷ niệm', value: 'Kỷ niệm' }
            ], default: 'Chia sẻ'
        },
        { name: 'text', label: 'Nội dung', type: 'textarea' }
    ]
}
export const GAME_RULES = {
    'wild-cards': 'Mọi luật chơi mới đều là tối cao. Kẻ phá luật nhận án phạt nhỉnh hơn (Nhấp thêm 1 hơi).',
    'truth-or-dare': 'Sự thật là tuyệt đối. Thách thức là danh dự. Bỏ lượt quá 3 lần, định mệnh sẽ trừng phạt.',
    'spotlight': 'Lời buộc tội phải có căn cứ. Người bị chỉ định phải chấp hành hình phạt ngay lập tức.',
    'trivia': 'Kiến thức là sức mạnh, chất cồn là thuốc thử. Trả lời sai, sầu não nhấp môi.',
    'deep-secrets': 'Sự chân thành là cầu nối của linh hồn. Hãy chia sẻ và lắng nghe bằng cả trái tim.'
}
