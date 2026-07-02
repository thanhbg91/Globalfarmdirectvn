import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, User, Loader2, BookOpen, Leaf, HelpCircle, X } from 'lucide-react';

interface AIAssistantProps {
  onOptimizeDescription?: (optimizedText: string) => void;
  farmerMode?: boolean;
}

export default function AIAssistant({ onOptimizeDescription, farmerMode = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: farmerMode 
        ? 'Xin chào nhà nông! Tôi là Trợ Lý Nông Sản Việt. Tôi có thể giúp bạn tối ưu mô tả sản phẩm nông sản sạch thu hút khách hàng, tư vấn kỹ thuật gieo trồng organic, định giá nông sản hoặc cách bảo quản sau thu hoạch. Bạn cần hỗ trợ gì hôm nay?'
        : 'Xin chào quý khách! Tôi là Trợ Lý Nông Sản Việt. Bạn cần tôi gợi ý các công thức nấu ăn ngon giàu dinh dưỡng từ rau củ quả tươi sạch, tư vấn cách bảo quản nông sản tại nhà hay mẹo lựa chọn rau củ tươi ngon không?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<'general' | 'optimize-description' | 'recipe-advisor' | 'farmer-advisor'>(
    farmerMode ? 'optimize-description' : 'recipe-advisor'
  );

  const presets = farmerMode ? [
    {
      id: 'optimize-description',
      label: 'Tối ưu mô tả nông sản sạch',
      prompt: 'Hạt tiêu đen Đắk Lắk khô thơm, thu hoạch thủ công hạt chín, phơi nắng tự nhiên.',
      icon: Sparkles
    },
    {
      id: 'farmer-advisor',
      label: 'Tư vấn phòng sâu bệnh sinh học',
      prompt: 'Làm thế nào để phòng trị rệp sáp hại cây ăn quả bằng phương pháp sinh học tự nhiên không dùng thuốc hóa học?',
      icon: Leaf
    },
    {
      id: 'general',
      label: 'Cách bảo quản bưởi da xanh sau thu hoạch',
      prompt: 'Chia sẻ kinh nghiệm bảo quản bưởi da xanh tươi lâu, vỏ không bị héo sau khi hái.',
      icon: BookOpen
    }
  ] : [
    {
      id: 'recipe-advisor',
      label: 'Gợi ý món ăn dinh dưỡng từ sen',
      prompt: 'Gợi ý món ngon đại bổ từ Hạt sen tươi Đồng Tháp mười.',
      icon: BookOpen
    },
    {
      id: 'recipe-advisor',
      label: 'Mẹo lựa chọn xà lách tươi ngon',
      prompt: 'Làm thế nào để nhận biết xà lách thủy canh tươi sạch, giòn ngọt, không bị đắng?',
      icon: Leaf
    },
    {
      id: 'general',
      label: 'Mẹo bảo quản trái cây mùa hè',
      prompt: 'Làm sao để bảo quản vải thiều chín tươi lâu trong tủ lạnh không bị thâm vỏ?',
      icon: HelpCircle
    }
  ];

  const handleSend = async (textToSend: string, taskType = selectedTask) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskType,
          prompt: textToSend
        })
      });
      const data = await response.json();

      if (response.ok && data.text) {
        const aiMsg = {
          sender: 'ai' as const,
          text: data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // If it's a description optimization task and handler is provided, let farmer copy/apply it
        if (taskType === 'optimize-description' && onOptimizeDescription) {
          onOptimizeDescription(data.text);
        }
      } else {
        throw new Error(data.error || 'Response error');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: '⚠️ Không thể kết nối với máy chủ AI lúc này. Vui lòng thử lại sau hoặc nhập lại câu hỏi.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button
        id="ai-assistant-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-emerald-500/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-6 h-6 animate-pulse" />
        <span className="ml-2 font-medium text-sm hidden md:inline-block">Trợ Lý AI Nông Sản</span>
      </motion.button>

      {/* AIAssistant Modal / Slide-over Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
            {/* Overlay to close */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            {/* Chat Container */}
            <motion.div
              id="ai-assistant-container"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-600 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base flex items-center">
                      Trợ Lý AI Nông Sản
                      <Sparkles className="w-4 h-4 ml-1.5 text-yellow-300 fill-yellow-300" />
                    </h3>
                    <p className="text-xs text-emerald-100 font-medium">Sức mạnh từ Gemini 3.5 Flash</p>
                  </div>
                </div>
                <button
                  id="close-ai-assistant"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-emerald-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Selector Tabs */}
              <div className="px-4 py-2 bg-white border-b border-slate-200 flex space-x-2 text-xs overflow-x-auto">
                {farmerMode ? (
                  <>
                    <button
                      id="tab-opt"
                      onClick={() => setSelectedTask('optimize-description')}
                      className={`px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors whitespace-nowrap ${selectedTask === 'optimize-description' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      ✍️ Tối ưu mô tả
                    </button>
                    <button
                      id="tab-adv"
                      onClick={() => setSelectedTask('farmer-advisor')}
                      className={`px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors whitespace-nowrap ${selectedTask === 'farmer-advisor' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      🌱 Kỹ thuật gieo trồng
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      id="tab-rec"
                      onClick={() => setSelectedTask('recipe-advisor')}
                      className={`px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors whitespace-nowrap ${selectedTask === 'recipe-advisor' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      🍲 Gợi ý món ngon
                    </button>
                    <button
                      id="tab-gen"
                      onClick={() => setSelectedTask('general')}
                      className={`px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors whitespace-nowrap ${selectedTask === 'general' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      💡 Mẹo tiêu dùng
                    </button>
                  </>
                )}
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full mr-2.5 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`text-[10px] mt-1.5 block text-right ${
                          msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="p-1.5 bg-slate-200 text-slate-700 rounded-full ml-2.5 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-2 text-slate-500 text-sm pl-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Trợ Lý AI đang suy nghĩ câu trả lời...</span>
                  </div>
                )}
              </div>

              {/* Preset Buttons */}
              <div className="p-3 bg-slate-100/80 border-t border-slate-200 flex flex-col space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">Bạn có thể hỏi nhanh:</span>
                <div className="grid grid-cols-1 gap-2">
                  {presets.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        id={`ai-preset-${idx}`}
                        onClick={() => handleSend(p.prompt, p.id as any)}
                        className="text-left text-xs p-2.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-2 font-medium"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Input Bar */}
              <form
                id="ai-message-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập câu hỏi tại đây..."
                  className="flex-1 text-sm bg-slate-100 hover:bg-slate-150 focus:bg-white border border-transparent focus:border-emerald-500 rounded-full px-4 py-2.5 focus:outline-hidden transition-all text-slate-800"
                />
                <button
                  id="send-ai-message"
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
