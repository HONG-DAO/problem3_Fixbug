#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kéo dữ liệu 1D từ FiinQuantX và lưu JSON với timestamp có giờ:phút:giây (Asia/Ho_Chi_Minh).
- Đọc user/pass từ biến môi trường: FIQ_USER, FIQ_PASS
- Danh sách mã: sửa trong biến TICKERS bên dưới
- Mặc định lấy 120 phiên gần nhất (có thể đổi period hoặc dùng from_date/to_date)
"""

import os
import json
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import FiinQuantX as fq  # pip install --extra-index-url https://fiinquant.github.io/fiinquantx/simple fiinquantx

# ======= CẤU HÌNH =======
TICKERS = [
    "ACL","ACM","ACS","ACV","ADC","ADG","ADP","ADS",
    "AFX","AGF","AGG","AGM","AGP","AGR","AGX",
]

FIELDS = ['open', 'high', 'low', 'close', 'volume', 'bu', 'sd']  # có thể thêm 'fb','fs','fn'
BY = '1d'          # khung thời gian
PERIOD = 120       # số nến gần nhất; hoặc dùng from_date='YYYY-MM-DD HH:MM'
OUTPUT_FILE = "fiinquant_1d.json"
TZ = ZoneInfo("Asia/Ho_Chi_Minh")

# ======= HÀM HỖ TRỢ =======
def normalize_epoch_to_iso(ts, tz: ZoneInfo) -> str:
    """
    Chuẩn hóa timestamp sang ISO 8601 (Asia/Ho_Chi_Minh).
    - Nếu ts là int hoặc chuỗi số => epoch (s hoặc ms).
    - Nếu ts là chuỗi "YYYY-MM-DD HH:MM" => parse datetime.
    """
    try:
        # Nếu là số hoặc string số
        if isinstance(ts, (int, float)) or (isinstance(ts, str) and ts.isdigit()):
            ts_int = int(ts)
            if ts_int < 10**12:  # giây
                dt = datetime.fromtimestamp(ts_int, tz=timezone.utc)
            else:                # mili-giây
                dt = datetime.fromtimestamp(ts_int / 1000.0, tz=timezone.utc)
            return dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S%z")

        # Nếu là chuỗi datetime
        if isinstance(ts, str):
            dt = datetime.strptime(ts, "%Y-%m-%d %H:%M")
            return dt.replace(tzinfo=TZ).strftime("%Y-%m-%d %H:%M:%S%z")

        # Trường hợp khác
        return str(ts)
    except Exception as e:
        return f"invalid_ts:{ts}"


# ======= MAIN =======
def main():
    username = "DSTC_17@fiinquant.vn"
    password = "Fiinquant0606"

    # Đăng nhập
    client = fq.FiinSession(username=username, password=password).login()

    # Gọi historical 1D
    event = client.Fetch_Trading_Data(
        realtime=False,
        tickers=TICKERS,
        fields=FIELDS,
        adjusted=True,        # dùng giá đã điều chỉnh; đổi False nếu cần giá gốc
        by=BY,
        period=PERIOD         # hoặc dùng from_date='2024-01-01 09:00', to_date='2025-09-17 16:00'
    )

    data = event.get_data()  # thường là list[dict] hoặc DataFrame tuỳ phiên bản

    # Chuẩn hoá sang list[dict]
    if hasattr(data, "to_dict"):           # pandas DataFrame
        records = data.to_dict(orient="records")
    elif isinstance(data, list):
        records = data
    else:
        raise TypeError(f"Kiểu dữ liệu không hỗ trợ: {type(data)}")

    # Map + chuẩn timestamp -> ISO có giờ:phút:giây (Asia/Ho_Chi_Minh)
    out = []
    for row in records:
        ts = row.get("timestamp")
        iso_vn = normalize_epoch_to_iso(ts, TZ) if ts is not None else None

        out.append({
            "ticker": row.get("ticker"),
            "timestamp": row.get("timestamp"),         # giữ raw
            "timestamp_iso_vn": iso_vn,                # ISO VN có HH:MM:SS
            "open": row.get("open"),
            "high": row.get("high"),
            "low": row.get("low"),
            "close": row.get("close"),
            "volume": row.get("volume"),
            "bu": row.get("bu"),
            "sd": row.get("sd"),
            # "fb": row.get("fb"), "fs": row.get("fs"), "fn": row.get("fn"),  # mở nếu bạn thêm vào FIELDS
        })

    # Ghi JSON (giữ nguyên Unicode, format đẹp)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Đã lưu {len(out)} dòng vào {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
