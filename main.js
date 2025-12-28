// サークル情報などを格納する配列
let circle_arr = [];
// グッズ情報などを格納する配列
let goods_arr = []

// ブラウザ保存用と読み出し用を共有
let stored1 = [];
let stored2 = {};
// おかしくなった時にリセットする用
//localStorage.removeItem('bookmark');

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

  // ブラウザ保存データ読み込み
  if (localStorage.hasOwnProperty('bookmark')) {
    if (localStorage.getItem('bookmark').length > 0) {
      stored1 = localStorage.getItem('bookmark').split(',');
      //console.log(stored1);

      // データ数0だとここでエラー出るよ
      for (const data of stored1) {
        let desk_id = '#' + data.slice(0, 3);
        $('.container').find(desk_id).addClass('fav');
      }
    }
  }

  if (localStorage.hasOwnProperty('purchase')) {
    stored2 = JSON.parse(localStorage.getItem('purchase') || '');
    //console.log(stored2);
  }
});

// ブックマークをリセット
$('#reset').on('click', function () {
  const ans = window.confirm('ブックマークを初期化しますか？');
  if (ans) {
    if (localStorage.hasOwnProperty('bookmark')) {
      // ブラウザ保存データを初期化
      localStorage.setItem('bookmark', '');

      const $club = $('.club');
      $('.container').find('.booth').removeClass('fav');
      $club.find('.favorite').prop('checked', false);
      $club.find('.mark').text('☆');
      $club.find('.mark').css('color', 'black');
    }
  }
});

// キーワード検索を実行
$('#search').on('click', function () {
  const keyword = $(this).prev().val();
  // 表示を初期化
  $('.tbl').find('.booth, .another').removeClass('match');
  $('.club').find('.place, .name, .master').removeClass('match');

  if (keyword) {
    circle_arr.forEach(function (v) {
      // ホール番号は除外
      if (v.place.slice(3,).includes(keyword) || v.name.includes(keyword) || v.master.includes(keyword)) {
        $('.tbl').find('#' + v.place.slice(3,6)).addClass('match');
      }
    });
  }
});

// お気に入り(☆)をクリック
$('#output').on('click', '.mark', function () {
  const location  = $(this).closest('.information').children('.place').text();
  const desk = location.slice(location.indexOf(' ') + 1, location.indexOf('-'));
  const desk_id = '#' + desk;
  const booth = location.slice(location.indexOf(' ') + 1, location.indexOf(')')).replace('-', '');

  $this = $(this);
  if ($this.text() == '☆') {
    // 要素を追加
    stored1.push(booth);
    $this.text('★');
    $this.css('color', 'yellow');
    $('.container').find(desk_id).addClass('fav');
  } else {
    //要素を削除
    stored1.some(function(v, i) {
      if (v == booth) stored1.splice(i, 1);
    });

    $this.text('☆');
    $this.css('color', 'black');
    if (stored1.includes(desk + 'a') || stored1.includes(desk + 'b')) {
      $('.container').find(desk_id).addClass('fav');
    } else {
      $('.container').find(desk_id).removeClass('fav');
    }
  }
  localStorage.setItem('bookmark', stored1.join(','));
});

// ブースをクリック
$('.tbl').on('click', '.booth, .another', function () {
    const desk = $(this).prop('id');
    const data = circle_arr.filter(c => c.place.includes(desk));
    const label = data.map(d => d.place.slice(6,));
    const $desk_id = label.map(lb => $('#' + lb));

    // 一旦全て非表示
    $('#ab, #a, #b').hide();

    for (let i = 0; i < label.length; i++) {
      let hall = data[i].place.slice(0,3);
      let place_name = hall + ' ' + desk + '-' + label[i];
      $desk_id[i].find('.place').text('(' + place_name + ')');
      $desk_id[i].find('.name').text(data[i].name);
      $desk_id[i].find('.master').text(data[i].master);

      let $product = $desk_id[i].find('.url');
      $product.find('.goods').attr('href', data[i].xurl);
      if (data[i].xurl != '') {
        $product.show();
      } else {
        $product.hide();
      }

      let $mark = $desk_id[i].find('.mark');
      if (stored1.includes(desk + label[i])) {
        $mark.text('★');
        $mark.css('color', 'yellow');
      } else {
        $mark.text('☆');
        $mark.css('color', 'black');
      }

      if (data[i].menu > 0) {
        $desk_id[i].find('.menu, .menu_').show();

        if (goods_arr.findIndex(g => g.booth === (desk + label[i])) > -1) {
          $desk_id[i].find('.list, .list_').show();
        } else {
          $desk_id[i].find('.list, .list_').hide();
        }
      } else {
        $desk_id[i].find('.menu, .menu_').hide();
        $desk_id[i].find('.list, .list_').hide();
      }
      $desk_id[i].show();
    }
    // 使い方・更新履歴のリンクを隠す
    $('.link').hide();
});

// お品書きをクリック
$('.club').on('click', '.menu', function () {
  const location  = $(this).closest('.club').find('.place').text();
  const booth = location.slice(location.indexOf(' ') + 1, location.indexOf(')')).replace('-', '');

  const img_dir = './img/';
  // お品書きは1ページまでは存在
  const img_url = img_dir + booth + '_menu1.jpg';
  $('#menu_img').attr('src', img_url);

  const $pages = $('#pages');
  $pages.children('.page_num').text(1);
  const page_max = circle_arr.find(c => c.place.slice(2,) === booth).menu;
  $pages.children('.page_all').text(page_max);

  if ( page_max > 1) {
    $pages.children('.back, .go').show();
  } else {
    $pages.children('.back, .go').hide();
  }
});

// 次ページに進む
$('#pages').on('click', '.go', function () {
  const $pages = $('#pages');
  const current_page = Number($pages.children('.page_num').text());
  const final_page = Number($pages.children('.page_all').text());
  const next_page = current_page + 1;
  const current_url = $('#menu_img').attr('src');

  if (current_page < final_page) {
    var next_url = current_url.replace('menu' + String(current_page), 'menu' + String(next_page));
    $pages.children('.page_num').text(next_page);
  } else {
    var next_url = current_url.replace('menu' + String(current_page), 'menu1');
    $pages.children('.page_num').text(1)
  }
  $('#menu_img').attr('src', next_url);
});

// 前ページに戻る
$('#pages').on('click', '.back', function () {
  const $pages = $('#pages');
  const current_page = Number($pages.children('.page_num').text());
  const final_page = Number($pages.children('.page_all').text());
  const prev_page = current_page - 1;
  const current_url = $('#menu_img').attr('src');

  if (current_page > 1) {
    var next_url = current_url.replace('menu' + String(current_page), 'menu' + String(prev_page));
    $pages.children('.page_num').text(prev_page);
  } else {
    var next_url = current_url.replace('menu' + String(current_page), 'menu' + String(final_page));
    $pages.children('.page_num').text(final_page)
  }
  $('#menu_img').attr('src', next_url);
});

// リストをクリック
$('.club').on('click', '.list', function () {
  const location  = $(this).closest('.club').find('.place').text();
  const booth = location.slice(location.indexOf(' ') + 1, location.indexOf(')')).replace('-', '');
  const items = goods_arr.filter(g => g.booth === booth);
  let list ='';

  for (const item of items) {
    list += '<div class="item">';
    list += '<span class="goods_name">';
    if (item.tag) list += '【' + item.tag + '】';
    list += item.kinds;
    if (item.unit) list += ' (' + item.unit + ')';
    list += '</span>';
    list += '</div>';
  }

  $('#goods_list').html(list);
});

$('#goods_list').on('click', '.goods_name', function () {
  const $item = $(this).parent('.item');
  if ($item.hasClass('select')) {
    $item.removeClass('select');
  } else {
    $item.addClass('select');
  }
  localStorage.setItem('purchase', JSON.stringify(stored2));
});


$('.popup').magnificPopup({
  type: 'inline',
  mainClass: 'mfp-fade', //フェードインアウトについてクラスを設定
  removalDelay: 100, //ポップアップが閉じるときの遅延時間を設定
});
// 閉じるボタン
$('.close').on('click', function (e) {
  e.preventDefault();
  $.magnificPopup.close();
});
