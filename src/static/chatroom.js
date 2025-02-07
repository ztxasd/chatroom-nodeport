const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const usernameDisplay = document.getElementById("usernameDisplay");
const loginButton = document.getElementById("loginButton");
const themeToggle = document.getElementById("themeToggle");


// 添加键盘事件监听器
messageInput.addEventListener('keydown', function (event) {
    // 如果按下的是回车键并且不是按住 shift 键时
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // 防止换行
        sendMessage(); // 触发发送消息
    }
});

// 获取 cookie 中的 clientid 和 uid
/*function getCookie(name) {
    const value = document.cookie;
    console.log(document.cookie);
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}*/

function getCookie(cname)
{
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) 
  {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}

//const clientid = getCookie("clientid");
const uid = getCookie("uid");
console.log(uid);

// 获取当前服务器的基础 URL
const serverUrl = window.location.origin;

// Base64 编码函数
function encodeBase64(str) {
    // 使用 TextEncoder 将字符串转换为 UTF-8 字节数组，然后用 btoa 编码成 Base64
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str); // 编码为UTF-8字节数组
    let binaryString = '';
    uint8Array.forEach(byte => {
        binaryString += String.fromCharCode(byte); // 将字节数组转换为二进制字符串
    });
    return btoa(binaryString); // 对二进制字符串进行 Base64 编码
}

// Base64 解码函数
function decodeBase64(base64Str) {
    const binaryString = atob(base64Str); // 对 Base64 字符串进行解码
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i); // 将二进制字符串转换为字节数组
    }
    const decoder = new TextDecoder();
    return decoder.decode(uint8Array); // 使用 TextDecoder 解码为原始字符串
}



let lastRenderedTimestamp = 0;  // 用于存储最后渲染的时间戳

async function fetchChatMessages() {
    try {
        const response = await fetch(`${serverUrl}/chat/messages`);
        if (response.ok) {
            const messages = await response.json();
            const isScrolledToBottom = chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 1;

            // 检查用户是否选中聊天框文本
            const isTextSelected = window.getSelection().toString() !== '';

            // 如果文本被选中，则不进行刷新
            if (isTextSelected) {
                return;
            }

            // 保存当前滚动位置
            const previousScrollTop = chatBox.scrollTop;

            let newMessages = [];

            // 只渲染时间戳大于 lastRenderedTimestamp 的消息
            messages.forEach(msg => {
                const msgTimestamp = new Date(msg.timestamp).getTime();  // 获取消息的时间戳

                // 如果消息是新消息，添加动画类
                if (msgTimestamp > lastRenderedTimestamp) {

                    msg.isNew = true; // 标记该消息为新消息
                    lastRenderedTimestamp = msgTimestamp;  // 更新最后渲染的时间戳
                }

                newMessages.push(msg);
            });

            chatBox.innerHTML = newMessages.map(msg => {
                let messageStyle = '';
                let messageContent = '';
                let background_color, textcolor;

                switch (msg.labei) {
                    case 'GM':
                        messageStyle = 'background-color: white; color: black;';
                        background_color = 'white', textcolor = 'black';
                        break;
                    case 'U':
                        messageStyle = 'background-color: rgba(0, 204, 255, 0.10); color: black;';
                        background_color = 'rgba(0, 204, 255, 0.10)', textcolor = 'black';
                        break;
                    case 'BAN':
                        messageStyle = 'background-color: black; color: black;';
                        background_color = 'black', textcolor = 'black';
                        break;
                    default:
                        messageStyle = 'background-color: white; color: black;';
                        background_color = 'white', textcolor = 'black';
                }

                // 深色模式下修改用户消息和背景的颜色为反转颜色
                if (document.body.classList.contains("dark-mode")) {
                    if (msg.labei === 'GM') {
                        messageStyle = 'background-color: black; color: white;';
                        background_color = 'black', textcolor = 'white';
                    } else if (msg.labei === 'U') {
                        messageStyle = 'background-color: rgba(0, 204, 255, 0.15); color: white;';
                        background_color = 'rgba(0, 204, 255, 0.15)', textcolor = 'white';
                    } else if (msg.labei === 'BAN') {
                        messageStyle = 'background-color: white; color: white;';
                        background_color = 'white', textcolor = 'white';
                    } else {
                        messageStyle = 'background-color: black; color: white;';
                        background_color = 'black', textcolor = 'white';
                    }
                }

                // 解码消息内容
                const decodedMessage = decodeBase64(msg.message);

                // 格式化时间戳
                const messageTime = new Date(msg.timestamp).toLocaleTimeString();

                // 如果消息中包含图片 URL，则渲染图片
                if (msg.imageUrl) {
                    messageContent = `
        <div class="message ${msg.user === 'system' ? '' : 'user'} ${msg.isNew ? 'fade-in' : ''}" style="${messageStyle}; white-space: normal; word-wrap: break-word;">
            <div class="header" style="background-color: rgba(0, 204, 255, 0.00);">
                <div class="username" style="color:${textcolor};">${msg.user}</div>
                <div class="timestamp" style="color:${textcolor};">${messageTime}</div>
            </div>
            <div class="image-message">
                 <br><img src="${msg.imageUrl}" alt="Image" style="max-width: 100%; height: auto;" /><br>
                ${decodedMessage}
            </div>
        </div>`;
                } else {
                    messageContent = `
        <div class="message ${msg.user === 'system' ? '' : 'user'} ${msg.isNew ? 'fade-in' : ''}" style="${messageStyle}; white-space: normal; word-wrap: break-word;">
            <div class="header" style="background-color: rgba(0, 204, 255, 0.00);">
                <div class="username" style="color:${textcolor};">${msg.user}</div>
                <div class="timestamp" style="color:${textcolor};">${messageTime}</div>
            </div>
            <div class="message-body">
                 ${decodedMessage}
            </div>
        </div>`;
                }

                

                return messageContent;
            }).join('');

            // 如果当前没有滚动到底部，则恢复之前的滚动位置
            if (!isScrolledToBottom) {
                chatBox.scrollTop = previousScrollTop;
            } else {
                // 滚动到最底端
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            console.error("Error fetching chat messages:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching chat messages:", error);
    }
}



const imageInput = document.getElementById("imageInput");

const imagePreview = document.getElementById("imagePreview");  // 用于显示缩略图的元素

function selectImage() {
    imageInput.click();  // 触发文件选择框
}

// 当用户选择文件时，显示缩略图
imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];
    if (file) {
        // 创建缩略图 URL
        const imageUrl = URL.createObjectURL(file);

        // 显示缩略图
        imagePreview.innerHTML = `<img src="${imageUrl}" alt="Image preview" style="max-width: 100px; height: auto; margin-left: 10px;" />`;
    } else {
        imagePreview.innerHTML = '';  // 如果没有选择文件，清除缩略图
    }
});

async function uploadImage(file) {

    console.log("Uploading file: ", file);
    const formData = new FormData();
    formData.append('file', file);
    console.log("FormData: ", formData);

    console.log(file);

    try {
        const response = await fetch(`${serverUrl}/chat/upload`, {
            method: 'POST',
            body: formData
        });
        //console.log("114514");
        if (response.ok) {
            
            const data = await response.json();
            return data.imageUrl; // 返回图片的 URL
        } else {
            //console.log("114514");
            console.error("Error uploading image:", response.statusText);
            return null;
        }
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
}

async function sendMessage() {
    const messageText = messageInput.value.trim();
    const imageFile = imageInput.files[0];  // 获取用户选择的图片

    if (messageText === '' && !imageFile) {
        return;  // 如果没有消息和图片，什么也不做
    }

    let imageUrl = '';
    if (imageFile) {
        imageUrl = await uploadImage(imageFile);  // 上传图片并获取图片 URL
        console.log(imageUrl);
    }

    const message = {
        message: encodeBase64(messageText),
        uid: uid,
        imageUrl: imageUrl,  
        timestamp: new Date().toISOString()  // 添加时间戳
    };

    try {
        const response = await fetch(`${serverUrl}/chat/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (response.ok) {
            messageInput.value = '';
            imageInput.value = '';  // 清除文件选择框
            imagePreview.innerHTML = '';  // 清除缩略图
            await fetchChatMessages();  // 拉取并更新消息

            // 滚动到最底端
            chatBox.scrollTop = chatBox.scrollHeight;

        } else if (response.status === 400) {
            //deleteCookie("clientid");
            deleteCookie("uid");
            window.location.href = "/login";
        } else {
            window.location.href = "/login";
            console.error("Error sending message:", await response.text());
        }
    } catch (error) {
        console.error("Error sending message:", error);
        window.location.href = "/login";
    }
}




// 获取用户名并显示在顶部栏
async function fetchUsername() {
    try {
        //const response = await fetch(`${serverUrl}/user/username?uid=${uid}`);
        const response = await fetch(`${serverUrl}/user/username`);
        if (response.ok) {
            const data = await response.json();
            usernameDisplay.textContent = `${data.username}`;
            loginButton.style.display = 'none';  // 隐藏登录按钮
        } else {
            console.error("Error fetching username:", response.statusText);
            loginButton.style.display = 'inline-block';  // 显示登录按钮
        }
    } catch (error) {
        console.error("Error fetching username:", error);
        loginButton.style.display = 'inline-block';  // 显示登录按钮
    }
}

// 检测系统的主题模式，并设置初始主题
function detectSystemTheme() {
    const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemDarkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

// 切换主题模式
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    isUserChangingTheme = true; // 用户手动切换了主题
});

// 初始化：检测系统主题，直到用户手动切换
let isUserChangingTheme = false;
detectSystemTheme();

// 监听系统主题变化，自动切换主题（仅在用户未手动切换时）
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!isUserChangingTheme) {
        if (e.matches) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }
});

fetchChatMessages();
setInterval(fetchChatMessages, 500);

fetchUsername(); // 获取并显示用户名

const sendButton = document.getElementById("sendButton");

sendButton.addEventListener("click", function () {
    // 启动点击效果
    sendButton.classList.add("clicked");

    // 等待一小段时间后移除点击效果类
    setTimeout(() => {
        sendButton.classList.remove("clicked");
    }, 200);  // 动效持续时间
});

