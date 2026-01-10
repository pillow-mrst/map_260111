// サークル情報などを格納する配列
let circle_arr = [];
// グッズ情報などを格納する配列
let goods_arr = []

// ブラウザ保存用と読み出し用を共有
let favoriteBooths = [];
let stored2 = [];
// おかしくなった時にリセットする用
//localStorage.removeItem('bookmark');
//localStorage.removeItem('purchase');

// 支払い計算＋値の反映
function calcSumDisp() {
  let sum = 0;

  $('.item.select').each(function () {
    const $item = $(this);
    const price = Number($item.find('.goods_price').data('price'));
    const qty = Number($item.find('.buy_num').val());
    sum += price * qty;
  });

  $('#accounting').children('.payment').text(sum.toLocaleString());
};

// 総支払い計算＋値の反映
function calcTotalDisp() {
  let total = 0;

  for (const saved of stored2) {
    total += saved.price * saved.num;
  }
  $('#total').children('.payment').text(total.toLocaleString());;
};


$(document).ready(async function() {
  // jsonファイル読み込み
  try {
    const response = await fetch('./circle.json');
    circle_arr = await response.json();
  } catch (error) {
    console.error(error.message);
  }

  try {
    const response = await fetch('./goods.json');
    goods_arr = await response.json();
  } catch (error) {
    console.error(error.message);
  }
});

// copilot未修正したい
// データを保存
$('#save').on('click', function () {
  const ans = window.confirm('保存データがある場合は上書きします。\nデータを保存してもよろしいですか？');
  if (ans) {
    localStorage.setItem('bookmark', favoriteBooths.join(','));
    localStorage.setItem('purchase', JSON.stringify(stored2));

    alert('データの保存が完了しました。');
  }
});

// copilot未修正したい
// 保存データを呼び出す
$('#load').on('click', function () {
  const ans = window.confirm('保存データを呼び出してもよろしいですか？');
  if (ans) {
    // 一旦初期化
    const $club = $('.club');
    $('.container').find('.booth').removeClass('fav');
    $club.find('.favorite').prop('checked', false);
    $club.find('.mark').text('☆').css('color', 'black');

    if (localStorage.hasOwnProperty('bookmark')) {
      // 変更するとエラー出るので注意
      if (localStorage.getItem('bookmark').length > 0) {
        favoriteBooths = localStorage.getItem('bookmark').split(',') || '[]';
        //console.log(favoriteBooths);

        // データ数0だとここでエラー出るよ
        for (const favBooth of favoriteBooths) {
          let desk_id = '#' + favBooth.slice(0, 3);
          $('.container').find(desk_id).addClass('fav');
        }
      }
    }

    if (localStorage.hasOwnProperty('purchase')) {
      stored2 = JSON.parse(localStorage.getItem('purchase') || '[]');
      //console.log(stored2);
      calcTotalDisp();
    }

    alert('保存したデータを呼び出しました。');
  }
});

// キーワード検索を実行
$('#search').on('click', function () {
  const keyword = $(this).prev().val().trim();

  // --- 初期化 ---
  $('.tbl .booth, .tbl .another').removeClass('match');
  $('.club .place, .club .name, .club .master').removeClass('match');

  if (!keyword) return;

  // --- 検索処理 ---
  circle_arr.forEach(circle => {
    const boothId = circle.place.slice(3, 6); // 机番号（例: A01）

    const isMatch =
      circle.place.slice(3).includes(keyword) ||
      circle.name.includes(keyword) ||
      circle.master.includes(keyword);

    if (isMatch) {
      $(`#${boothId}`).addClass('match');
    }
  });
});

// お気に入り(☆)をクリック
$('#output').on('click', '.mark', function () {

  const $mark = $(this);

  // --- booth / deskNumber の抽出 ---
  const placeText = $mark.closest('.information').find('.place').text();
  const deskNumber = placeText.slice(placeText.indexOf(' ') + 1, placeText.indexOf('-'));
  const booth = placeText.slice(placeText.indexOf(' ') + 1, placeText.indexOf(')')).replace('-', '');
  const deskSelector = `#${deskNumber}`;

  // --- お気に入り登録 or 解除 ---
  const isFav = $mark.text() === '☆';

  if (isFav) {
    // ★ に変更（お気に入り追加）
    favoriteBooths.push(booth);
    $mark.text('★').css('color', 'yellow');
    $('.container').find(deskSelector).addClass('fav');

  } else {
    // ☆ に変更（お気に入り削除）
    favoriteBooths = favoriteBooths.filter(circle => circle !== booth);

    $mark.text('☆').css('color', 'black');

    // deskNumber + a / deskNumber + b のどちらかが残っているか判定
    const stillFav = favoriteBooths.includes(deskNumber + 'a') || favoriteBooths.includes(deskNumber + 'b');
    $('.container').find(deskSelector).toggleClass('fav', stillFav);
  }
});

// ブースをクリック
$('.tbl').on('click', '.booth, .another', function () {

  const $this_path = $(this);
  const deskNumber = $this_path.prop('id');
  // booth に該当するデータを取得
  const matchedBooths = circle_arr.filter(circle => circle.place.includes(deskNumber));
  // ラベル（机の右側の番号）を抽出
  const seatLabels = matchedBooths.map(booth => booth.place.slice(6));
  // 対応する DOM 要素を取得
  const $deskElements = seatLabels.map(lb => $('#' + lb));

  //$('#menu_img').attr('src', './');
  // 一旦全て非表示
  $('#ab, #a, #b').hide();
  $('.booth, .another').removeClass('touch');
  $this_path.addClass('touch');

  // 各 booth の情報を反映
  for (let i = 0; i < seatLabels.length; i++) {

    const boothData = matchedBooths[i];
    const $deskElement = $deskElements[i];

    const hallCode = boothData.place.slice(0, 3);
    const placeName = `${hallCode} ${deskNumber}-${seatLabels[i]}`;

    // 基本情報
    $deskElement.find('.place').text(`(${placeName})`);
    $deskElement.find('.name').text(boothData.name);
    $deskElement.find('.master').text(boothData.master);

    // 商品リンク
    const $productLink = $deskElement.find('.url');
    $productLink.find('.goods').attr('href', boothData.xurl);
    boothData.xurl ? $productLink.show() : $productLink.hide();

    // お気に入りマーク
    const $mark = $deskElement.find('.mark');
    const isFav = favoriteBooths.includes(deskNumber + seatLabels[i]);
    $mark.text(isFav ? '★' : '☆');
    $mark.css('color', isFav ? 'yellow' : 'black');

    // メニュー・リスト表示
    const hasMenu = boothData.menu > 0;
    const hasList = goods_arr.some(g => g.booth === deskNumber + seatLabels[i]);

    $deskElement.find('.menu, .menu_').toggle(hasMenu);
    $deskElement.find('.list, .list_').toggle(hasList);

    // 最後に表示
    $deskElement.show();
  }

  // 使い方・更新履歴のリンクを隠す
  $('.link').hide();
});

// お品書きをクリック
$('.menu').on('click', function (e) {
  e.preventDefault();

  // --- booth 抽出 ---
  const placeText = $(this).closest('.club').find('.place').text();
  const booth = placeText
    .slice(placeText.indexOf(' ') + 1, placeText.indexOf(')'))
    .replace('-', '');

  // --- ページ情報更新 ---
  const $pages = $('#pages');
  const $pageNum = $pages.children('.page_num');
  const $pageAll = $pages.children('.page_all');

  $pageNum.text(1);

  const pageMax = circle_arr.find(c => c.place.slice(3) === booth)?.menu ?? 1;
  $pageAll.text(pageMax);

  const $navButtons = $pages.children('.back, .go');
  pageMax > 1 ? $navButtons.show() : $navButtons.hide();

  // --- 画像切り替え ---
  const imgUrl = `./img_webp/${booth}_menu1.webp`;
  const $img = $('#menu_img');
  const $spinner = $('.spinner');
  const target = $(this).attr('href'); // #inline-menu

  // スピナー表示、画像は隠す
  $spinner.show();
  $img.hide();

  // ポップアップを開く関数（load の外に置く）
  function openPopup() {
    $.magnificPopup.open({
      items: { src: target },
      type: 'inline',
      mainClass: 'mfp-fade',
      removalDelay: 100,
      callbacks: {
        open: function () {
          $spinner.hide();
          $img.show();
        }
      }
    });
  }

  // まず load を設定してから src を変える
  $img.off('load').one('load', function () {
    openPopup();   // ← これが必要
  });

  // キャッシュ対策
  $img.attr('src', imgUrl + '?v=' + Date.now());
});

// 次ページに進む
$('#pages').on('click', '.go', function () {
  const $pages = $('#pages');
  const $pageNum = $pages.children('.page_num');
  const currentPage = Number($pageNum.text());
  const finalPage = Number($pages.children('.page_all').text());
  const nextPage = currentPage < finalPage ? currentPage + 1 : 1;

  const $img = $('#menu_img');
  const currentUrl = $img.attr('src');

  // menuX の X 部分だけを置き換える
  const nextUrl = currentUrl.replace(/menu\d+/, `menu${nextPage}`);

  // ページ番号更新
  $pageNum.text(nextPage);

  // 画像更新
  $img.attr('src', nextUrl);
});

// 前ページに戻る
$('#pages').on('click', '.back', function () {
  const $pages = $('#pages');
  const $pageNum = $pages.children('.page_num');
  const currentPage = Number($pageNum.text());
  const finalPage = Number($pages.children('.page_all').text());
  const prevPage = currentPage > 1 ? currentPage - 1 : finalPage;

  const $img = $('#menu_img');
  const currentUrl = $img.attr('src');

  // menuX の X 部分だけを安全に置き換える
  const nextUrl = currentUrl.replace(/menu\d+/, `menu${prevPage}`);

  // ページ番号更新
  $pageNum.text(prevPage);

  // 画像更新
  $img.attr('src', nextUrl);
});

// リストをクリック
$('.club').on('click', '.list', function () {
  const place  = $(this).closest('.club').find('.place').text();
  const booth = place.slice(place.indexOf(' ') + 1, place.indexOf(')')).replace('-', '');
  const items = goods_arr.filter(g => g.booth === booth);

  let list = '';

for (const item of items) {
  const maxValue = item.limit ? item.limit : 10;

  // プルダウンの選択肢を生成
  let options = '';
  for (let i = 0; i <= maxValue; i++) {
    options += `<option value="${i}">${i}</option>`;
  }

  list += `
    <div class="item">
      <div class="goods">
        <span class="goods_name">
          ${item.tag ? `【${item.tag}】` : ''}${item.kinds}${item.unit ? ` (${item.unit})` : ''}
        </span>
        <span class="goods_num">
          ×
          <select class="buy_num" name="buy_num">
            ${options}
          </select>
        </span>
      </div>

      <div class="goods_price" data-price="${item.price}">
        ${item.price.toLocaleString()} 円/個
      </div>
    </div>
  `;
}

  $('#goods_list').html(list);
  $('#goods_list').data('booth', `${booth}`);

  // --- stored2 の内容を反映 ---
  const currentBooth = $('#goods_list').data('booth');

  // このブースのデータだけに絞る
  const savedItems = stored2.filter(s => s.booth === currentBooth);

  $('#goods_list .item').each(function () {
    const $item = $(this);

    const nameText = $item.find('.goods_name').text().trim();
    const priceValue = Number($item.find('.goods_price').data('price'));

    const saved = savedItems.find(s =>
      s.name === nameText &&
      s.price === priceValue
    );

    if (!saved) return;

    $item.find('.buy_num').val(saved.num);
    if (saved.num > 0) {
      $item.addClass('select');
    }
  });

  /*
  let sum = 0;
  // 支払い計算(画面切り替え用)
  $('.item.select').each(function () {
    const $item = $(this);
    const price = Number($item.find('.goods_price').data('price'));
    const qty = Number($item.find('.buy_num').val());
    sum += price * qty;
  });
  $('#accounting').children('.payment').text(sum);
  */

  // 支払い計算(画面切り替え用)
  calcSumDisp();
});

// 購入個数が変更されたとき
$('#goods_list').on('change', '.buy_num', function () {
  const $num = $(this);
  const booth_name = $('#goods_list').data('booth');

  const $item = $num.closest('.item');
  // 空白や改行を削除
  const goods_name = $item.find('.goods_name').text().trim();
  const goods_price = Number($item.find('.goods_price').data('price'));

  // 0より大きいかで選択状態を切り替え
  const qty = Number($num.val());
  $item.toggleClass('select', qty > 0);

  // --- stored2 の更新処理 ---
  // 既存データを検索
  const existing = stored2.find(item =>
    item.booth === booth_name && item.name === goods_name && item.price === goods_price
  );

  if (qty > 0) {
    if (existing) {
      // 既存データがあれば数量を更新
      existing.num = qty;
    } else {
      // なければ新規追加
      stored2.push({
        booth: booth_name,
        name: goods_name,
        price: goods_price,
        num: qty
      });
    }
  } else {
    // qty が 0 → 該当データを削除
    stored2 = stored2.filter(item =>
      !(item.booth === booth_name && item.name === goods_name && item.price === goods_price)
    );
  }

  /*
  let sum = 0;
  // 支払い計算
  $('.item.select').each(function () {
    const $item = $(this);
    const price = Number($item.find('.goods_price').data('price'));
    const qty = Number($item.find('.buy_num').val());
    sum += price * qty;
  });
  $('#accounting').children('.payment').text(sum);
  */
  calcSumDisp();

  /*
  let total = 0;
  // 総支払い計算
  for (const saved of stored2) {
    total += saved.price * saved.num;
  }
  $('#total').children('.payment').text(total);
  */
  calcTotalDisp();
});


//$('.popup').magnificPopup({
$('.list').magnificPopup({
  type: 'inline',
  mainClass: 'mfp-fade', //フェードインアウトについてクラスを設定
  removalDelay: 100, //ポップアップが閉じるときの遅延時間を設定
});

// 閉じるボタン
$('.close').on('click', function (e) {
  e.preventDefault();
  $.magnificPopup.close();
});
