export function countWeekdaysInCurrentMonth() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  let count = 0;

  // Duyệt qua các ngày từ 1 đến 31 trong tháng hiện tại
  for (let day = 1; day <= 31; day++) {
    const date = new Date(currentYear, currentMonth, day);

    // Kiểm tra xem ngày này có thuộc vào từ thứ 2 đến thứ 6 không (0 = Chủ Nhật, 1 = Thứ 2, 2 = Thứ 3, ..., 6 = Thứ 7)
    const dayOfWeek = date.getDay();

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }

    // Nếu đã qua ngày cuối cùng của tháng, thoát khỏi vòng lặp
    if (date.getMonth() > currentMonth) {
      break;
    }
  }

  return count;
}
