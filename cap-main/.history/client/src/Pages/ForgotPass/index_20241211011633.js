import { Link } from "react-router-dom";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { useState } from "react";
import userApi from "src/apis/user.api"; // Đảm bảo import hàm forgetPassword từ module API
import { toast } from "react-toastify";

export default function Forgetpassword() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Hàm xử lý gửi dữ liệu
  const onSubmit = async (e) => {
    e.preventDefault(); // Ngừng hành động mặc định của form

    try {
      await userApi.forgetPassword({ email });
      setShowSuccess(true); // Hiển thị thông báo thành công
    } catch (error) {
      toast.error("Mật khẩu chưa được gửi! Vui lòng thử lại", {
        autoClose: 1300,
      });
    }
  };

  // Hiển thị thông báo thành công và điều hướng
  useEffect(() => {
    if (showSuccess) {
      toast.success("Mật khẩu đã được gửi", { autoClose: 1300 });
      const timer = setTimeout(() => {
        navigate("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <div className="bg-yellow pt-8 font">
      <div className=" h-[683px] ">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 py-8 lg:py-14 lg:pr-10 bg-white border rounded-xl ">
            <div className="lg:col-span-3 lg:col-start-1 px-6">
              {/* <img
                src='https://bazaarvietnam.vn/wp-content/uploads/2020/01/my-pham-xanh-03-drunk-elephant-hibiscus.jpg'
                alt=''
              /> */}
            </div>
            <form
              className="p-6 border-2 border-gray-100 rounded-lg shadow-sm lg:col-span-2 lg:col-start-4 place-content-center"
              noValidate
              onSubmit={onSubmit} // Gọi hàm onSubmit khi form được submit
            >
              <div className="text-2xl mb-4 font-bold text-center">
                Tìm kiếm tài khoản của bạn{" "}
              </div>
              <p className="text-base mb-3">
                Nhận mã xác minh được gửi đến email của bạn !
              </p>
              <div className="text-xl font-semibold">Email address</div>
              <input
                type="email"
                className="mt-4 w-full border p-3 rounded-lg"
                placeholder="Please Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Lấy giá trị từ input và cập nhật state
              />
              <div className="mt-1">
                <button
                  type="submit" // Đặt type là submit để kích hoạt sự kiện handleSubmit
                  className="w-full text-center py-4 border rounded-lg px-2 uppercase bg-pink_3 text-white text-sm hover:bg-pink_3/90"
                >
                  Send
                </button>
              </div>
              <div className="mx-auto mt-2 w-max">
                <Link
                  className="flex items-center text-sm font-medium gap-x-1 text-gray-600"
                  to="/login"
                >
                  <HiArrowNarrowLeft />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
