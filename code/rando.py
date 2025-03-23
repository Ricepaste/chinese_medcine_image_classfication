import random as r
import os
import PIL.Image as Image

# 隨機抽樣資料夾中的照片並顯示出來


def show_random_image(med_error):
    # 設定照片資料夾
    path = './code/photo/'
    # 讀取資料夾中的檔案
    files = os.listdir(path)
    # 隨機抽樣
    i = r.randint(0, len(files))

    error = []
    ans_num = 0
    cor_num = 0
    while True:
        try:
            # 顯示照片
            img = Image.open(path + files[i])
            img.show()

            _ = input('enter to continue')
            print(files[i])

            # 記錄答案
            ans = input('請輸入答案(0/1/-1):')
            img.close()
            img = None
            if ans == '0':
                ans_num += 1
                error.append(files[i])
            elif ans == '1':
                cor_num += 1
                ans_num += 1
            elif ans == '-1':
                break
            i = r.randint(0, len(files))
            os.system('cls')
        except:
            break
    print()
    if ans_num == 0:
        return
    print('答對百分比:', cor_num/ans_num * 100, '%')
    # print('答對數:', cor_num)
    # print('答錯數:', ans_num - cor_num)
    print('答錯的照片:')
    for i in error:
        print(i)
        if i in med_error:
            med_error[i] += 1
        else:
            med_error[i] = 1
    print()

    return med_error


med_error = {}
if __name__ == '__main__':
    with open('./code/error.txt', 'r', encoding='utf-8') as f:
        ip = f.readlines()
        for i in ip:
            med, times = i.split(' ')
            med_error[med] = int(times)
    med_error = show_random_image(med_error)
    try:
        with open('./code/error.txt', 'w', encoding='utf-8') as f:
            for i, j in sorted(med_error.items(), key=lambda x: x[1], reverse=True):
                f.write(f'{i} {j}\n')
    except:
        pass
