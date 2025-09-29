// 1단계에서 복사해 둔 나의 Firebase 프로젝트 '비밀 열쇠'를 여기에 붙여넣어 주세요!
const firebaseConfig = {
  apiKey: "AIzaSyC103yKBIqWbanGh4qTWoclo8gTNLJAU44",
  authDomain: "youthcafe-8703d.firebaseapp.com",
  projectId: "youthcafe-8703d",
  storageBucket: "youthcafe-8703d.firebasestorage.app",
  messagingSenderId: "30683407833",
  appId: "1:30683407833:web:c0cf5c22980ca8a3e665c8"
};

// Firebase 앱 초기화
// try-catch 구문으로 감싸서 혹시 모를 중복 초기화 오류를 방지합니다.
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase initialize app error", e);
}
const db = firebase.firestore();

// =====================================================================
// == index.html (방명록) 페이지를 위한 코드 ==
// =====================================================================
// 'guestbook-canvas' 요소가 있는 페이지에서만 이 코드가 실행됩니다.
const guestbookCanvas = document.getElementById('guestbook-canvas');
if (guestbookCanvas) {
    const messageForm = document.getElementById('message-form');

   const saveMessage = async (event) => {
    event.preventDefault();

    const messageInput = document.getElementById('message');
    // 아이콘 대신 선택된 배경색 가져오기
    const selectedColor = document.querySelector('input[name="bgColor"]:checked');

    if (messageInput.value.trim() === '' || !selectedColor) {
        alert('메시지와 배경색을 모두 선택해줘!');
        return;
    }

    const x = Math.floor(Math.random() * 85);
    const y = Math.floor(Math.random() * 85);

    // 데이터베이스에 저장할 내용 수정 (iconUrl -> bgColor)
    const messageData = {
        text: messageInput.value,
        bgColor: selectedColor.value,
        x: x + '%',
        y: y + '%',
        createdAt: new Date()
    };

    try {
        await db.collection('messages').add(messageData);
        messageInput.value = '';
        alert('메시지를 성공적으로 남겼어!');
        location.reload();
    } catch (error) {
        console.error("메시지 저장 중 오류 발생: ", error);
        alert('메시지를 남기는 데 실패했어. 다시 시도해줘 ㅠㅠ');
    }
};
  
   const loadMessages = async () => {
    try {
        const querySnapshot = await db.collection('messages').orderBy('createdAt', 'desc').limit(30).get();
        guestbookCanvas.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const message = doc.data();
            const docId = doc.id;
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.style.left = message.x;
            bubble.style.top = message.y;
            // 말풍선 배경색을 저장된 색상으로 설정
            bubble.style.backgroundColor = message.bgColor;

            // 말풍선 내부 HTML에서 이미지 태그 제거
            bubble.innerHTML = `<span>${message.text}</span>`;

            // (드래그 기능 코드는 그대로 유지됩니다)
            let isDragging = false;
            let offsetX, offsetY;
            bubble.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - bubble.getBoundingClientRect().left;
                offsetY = e.clientY - bubble.getBoundingClientRect().top;
                bubble.style.cursor = 'grabbing';
                bubble.style.zIndex = 1000;
            });
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                let newX = e.clientX - offsetX - guestbookCanvas.getBoundingClientRect().left;
                let newY = e.clientY - offsetY - guestbookCanvas.getBoundingClientRect().top;
                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX + bubble.offsetWidth > guestbookCanvas.offsetWidth) newX = guestbookCanvas.offsetWidth - bubble.offsetWidth;
                if (newY + bubble.offsetHeight > guestbookCanvas.offsetHeight) newY = guestbookCanvas.offsetHeight - bubble.offsetHeight;
                bubble.style.left = `${(newX / guestbookCanvas.offsetWidth) * 100}%`;
                bubble.style.top = `${(newY / guestbookCanvas.offsetHeight) * 100}%`;
            });
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                bubble.style.cursor = 'grab';
                bubble.style.zIndex = 'auto';
                db.collection('messages').doc(docId).update({
                    x: bubble.style.left,
                    y: bubble.style.top
                }).catch(err => console.error("위치 업데이트 실패:", err));
            });
            guestbookCanvas.appendChild(bubble);
        });
    } catch (error) {
        console.error("메시지 로딩 중 오류 발생: ", error);
    }
};

    messageForm.addEventListener('submit', saveMessage);
    window.addEventListener('load', loadMessages);
}

// =====================================================================
// == counseling.html (고민 상담) 페이지를 위한 코드 ==
// =====================================================================
// 'counseling-form' 요소가 있는 페이지에서만 이 코드가 실행됩니다.
const counselingForm = document.getElementById('counseling-form');
if (counselingForm) {
    const replyCheckForm = document.getElementById('reply-check-form');

    const saveWorry = async (event) => {
        event.preventDefault();
        const worryInput = document.getElementById('worry');
        const passwordInput = document.getElementById('password');
        if (worryInput.value.trim() === '' || passwordInput.value.trim() === '') {
            alert('고민 내용과 비밀번호를 모두 입력해줘!');
            return;
        }
        const worryData = {
            worry: worryInput.value,
            password: passwordInput.value,
            reply: "",
            createdAt: new Date()
        };
        try {
            await db.collection('worries').add(worryData);
            alert('고민이 성공적으로 접수되었어! 비밀번호를 꼭 기억해줘!');
            worryInput.value = '';
            passwordInput.value = '';
        } catch (error) {
            console.error("고민 저장 중 오류 발생: ", error);
            alert('고민 접수에 실패했어. 다시 시도해줘 ㅠㅠ');
        }
    };

    const checkReply = async (event) => {
        event.preventDefault();
        const passwordInput = document.getElementById('check-password');
        const enteredPassword = passwordInput.value;
        const replyDisplay = document.getElementById('reply-display');
        if (enteredPassword.trim() === '') {
            alert('비밀번호를 입력해줘!');
            return;
        }
        try {
            const querySnapshot = await db.collection('worries').where('password', '==', enteredPassword).get();
            if (querySnapshot.empty) {
                alert('해당 비밀번호로 등록된 고민을 찾을 수 없어. 비밀번호를 다시 확인해줘!');
                replyDisplay.style.display = 'none';
            } else {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                document.getElementById('original-worry').textContent = data.worry;
                if (data.reply.trim() === '') {
                    document.getElementById('narosta-reply').textContent = "아직 나로스타쌤이 답변을 준비하고 있어. 조금만 기다려줘! 😊";
                } else {
                    document.getElementById('narosta-reply').textContent = data.reply;
                }
                replyDisplay.style.display = 'block';
            }
        } catch (error) {
            console.error("답변 확인 중 오류 발생: ", error);
        }
    };

    counselingForm.addEventListener('submit', saveWorry);
    replyCheckForm.addEventListener('submit', checkReply);
}

// =====================================================================
// == narosta-admin.html (관리자) 페이지를 위한 코드 ==
// =====================================================================
// 'worry-list' 요소가 있는 페이지에서만 이 코드가 실행됩니다.
const worryListContainer = document.getElementById('worry-list');
if (worryListContainer) {
    const loadAllWorries = async () => {
        try {
            const querySnapshot = await db.collection('worries').orderBy('createdAt', 'desc').get();
            worryListContainer.innerHTML = '';
            if (querySnapshot.empty) {
                worryListContainer.innerHTML = '<p>아직 접수된 고민이 없어요.</p>';
                return;
            }
            querySnapshot.forEach(doc => {
                const worryData = doc.data();
                const docId = doc.id;
                const card = document.createElement('div');
                card.className = 'worry-card';
                card.innerHTML = `
                    <p><strong>고민 내용:</strong> ${worryData.worry}</p>
                    <small>작성일: ${new Date(worryData.createdAt.seconds * 1000).toLocaleString()}</small>
                    <hr style="margin: 15px 0;">
                    <label for="reply-${docId}"><strong>답변 작성:</strong></label>
                    <textarea id="reply-${docId}" placeholder="여기에 답변을 작성해주세요...">${worryData.reply || ''}</textarea>
                    <button class="save-reply-btn" data-id="${docId}">답변 저장</button>
                `;
                worryListContainer.appendChild(card);
            });
        } catch (error) {
            console.error("고민 목록 로딩 중 오류 발생: ", error);
            worryListContainer.innerHTML = '<p>고민 목록을 불러오는 데 실패했습니다.</p>';
        }
    };

    const saveReply = async (event) => {
        if (!event.target.classList.contains('save-reply-btn')) {
            return;
        }
        const button = event.target;
        const docId = button.dataset.id;
        const replyTextarea = document.getElementById(`reply-${docId}`);
        const replyText = replyTextarea.value;
        try {
            await db.collection('worries').doc(docId).update({
                reply: replyText
            });
            alert('답변이 성공적으로 저장되었습니다!');
            button.textContent = '저장 완료!';
            setTimeout(() => {
                button.textContent = '답변 저장';
            }, 2000);
        } catch (error) {
            console.error("답변 저장 중 오류 발생: ", error);
            alert('답변 저장에 실패했습니다.');
        }
    };

    window.addEventListener('load', loadAllWorries);
    worryListContainer.addEventListener('click', saveReply);
}

// =====================================================================
// == activities.html 영상 슬라이더 기능을 위한 코드 ==
// =====================================================================
// 'slider-container' 요소가 하나라도 있는 페이지에서만 이 코드가 실행됩니다.
const sliders = document.querySelectorAll('.slider-container');
if (sliders.length > 0) {
    sliders.forEach(slider => {
        const wrapper = slider.querySelector('.slider-wrapper');
        const slides = slider.querySelectorAll('.video-slide');
        const prevBtn = slider.querySelector('.prev-btn');
        const nextBtn = slider.querySelector('.next-btn');

        if (slides.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentIndex = 0;
        const slideCount = slides.length;

        function updateSliderPosition() {
            if (wrapper) {
                wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
            }
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % slideCount;
                updateSliderPosition();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + slideCount) % slideCount;
                updateSliderPosition();
            });
        }
    });
}

// =====================================================================
// == magazine-admin.html (기사 작성) 페이지를 위한 코드 ==
// =====================================================================
const articleForm = document.getElementById('article-form');
if (articleForm) {
    const saveArticle = async (event) => {
        event.preventDefault();
        const title = document.getElementById('article-title').value;
        const author = document.getElementById('article-author').value;
        const content = document.getElementById('article-content').value;
        const imageUrl = document.getElementById('article-image-url').value;

        if (!title.trim() || !author.trim() || !content.trim()) {
            alert('기사 제목, 작성자, 내용은 필수 항목입니다!');
            return;
        }

        const articleData = {
            title: title,
            author: author,
            content: content,
            imageUrl: imageUrl.trim(),
            createdAt: new Date()
        };

        try {
            await db.collection('articles').add(articleData);
            alert('새 기사가 성공적으로 발행되었습니다!');
            articleForm.reset();
        } catch (error) {
            console.error("기사 저장 중 오류 발생: ", error);
            alert('기사 발행에 실패했습니다.');
        }
    };

  
    articleForm.addEventListener('submit', saveArticle);
} 

// =====================================================================
// == magazine.html (매거진 보기) 페이지를 위한 코드 ==
// =====================================================================
const latestArticleSection = document.getElementById('latest-article');

if (latestArticleSection) {
    let allArticles = [];

    const renderMagazinePage = (mainArticleId) => {
        const mainArticle = allArticles.find(article => article.id === mainArticleId);
        const archiveArticles = allArticles.filter(article => article.id !== mainArticleId);
        
        // 이미지가 있을 경우에만 이미지 태그를 생성
        const imageHtml = mainArticle.imageUrl 
            ? `<img src="${mainArticle.imageUrl}" alt="${mainArticle.title}" style="width:100%; border-radius:10px; margin-bottom:20px;">` 
            : '';

        latestArticleSection.innerHTML = `
            ${imageHtml}
            <h2>${mainArticle.title}</h2>
            <div class="meta">
                <span><strong>글쓴이:</strong> ${mainArticle.author}</span> | <span><strong>발행일:</strong> ${mainArticle.createdAt.toLocaleString()}</span>
            </div>
            <div class="content">
                <p>${mainArticle.content.replace(/\n/g, '</p><p>')}</p>
            </div>
        `;

        const archiveList = document.querySelector('#article-archive ul');
        archiveList.innerHTML = '';
        archiveArticles.forEach(article => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="#" data-id="${article.id}">${article.title}</a>`;
            archiveList.appendChild(listItem);
        });
    };

    const loadAllArticles = async () => {
        try {
            const querySnapshot = await db.collection('articles').orderBy('createdAt', 'desc').get();
            
            allArticles = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: new Date(doc.data().createdAt.seconds * 1000)
            }));

            if (allArticles.length > 0) {
                renderMagazinePage(allArticles[0].id);
            } else {
                latestArticleSection.innerHTML = '<p>아직 발행된 기사가 없습니다.</p>';
            }
        } catch (error) {
            console.error("기사 로딩 중 오류 발생:", error);
        }
    };
    
    document.querySelector('#article-archive').addEventListener('click', (event) => {
        if (event.target.tagName !== 'A') return;
        event.preventDefault();
        const clickedArticleId = event.target.dataset.id;
        renderMagazinePage(clickedArticleId);
    });

    window.addEventListener('load', loadAllArticles);
}