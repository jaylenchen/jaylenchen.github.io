import { DefaultTheme } from 'vitepress';

const tsalg = (subPath: string) => '/project/tsalg' + subPath

// ====================================数据结构=====================================

// =====数组=====
enum LcArray {
  next_permutation = '下一个排列',
  rotate_image = '旋转图像',
  spiral_matrix = '螺旋矩阵',
  set_matrix_zeroes = '矩阵置零',
  rotate_array = '轮转数组',
  maximal_square = '最大正方形',
  game_of_life = '生命游戏',
  sort_an_array = '排序数组'
}
const array = (subPath: string) => tsalg('/array/' + subPath)
const arraySidebar = {
  text: '数组',
  // items: [
  //   {
  //     text: LcArray.next_permutation,
  //     link: array(LcArray.next_permutation)
  //   },
  //   {
  //     text: LcArray.rotate_image,
  //     link: array(LcArray.rotate_image)
  //   },
  //   {
  //     text: LcArray.spiral_matrix,
  //     link: array(LcArray.spiral_matrix)
  //   },
  //   {
  //     text: LcArray.set_matrix_zeroes,
  //     link: array(LcArray.set_matrix_zeroes)
  //   },
  //   {
  //     text: LcArray.rotate_array,
  //     link: array(LcArray.rotate_array)
  //   },
  //   {
  //     text: LcArray.maximal_square,
  //     link: array(LcArray.maximal_square)
  //   },
  //   {
  //     text: LcArray.game_of_life,
  //     link: array(LcArray.game_of_life)
  //   },
  //   {
  //     text: LcArray.sort_an_array,
  //     link: array(LcArray.sort_an_array)
  //   }
  // ],
  collapsed: true
}

// =====链表=====
enum LcLinkedList {
  copy_list_with_random_pointer = '随机链表的复制',
  delete_node_in_a_linked_list = '删除链表中的节点',
  linked_list_cycle = '环形链表',
  linked_list_cycle_ii = '环形链表II',
  merge_two_sorted_lists = '合并两个有序链表',
  middle_of_the_linked_list = '链表的中间结点',
  odd_even_linked_list = '奇偶链表',
  partition_list = '分隔链表',
  remove_duplicates_from_sorted_list = '删除排序链表中的重复元素',
  remove_duplicates_from_sorted_list_ii = '删除排序链表中的重复元素II',
  reorder_list = '重排链表',
  reverse_linked_list = '反转链表',
  reverse_linked_list_ii = '反转链表II',
  reverse_nodes_in_k_group = 'K个一组翻转链表',
  rotate_list = '旋转链表',
  sort_list = '排序链表',
  swap_nodes_in_pairs = '两两交换链表中的节点'
}
const linkedList = (subPath: string) => tsalg('/linked-list/' + subPath)
const linkedListSidebar = {
  text: '链表',
  // items: [
  //   {
  //     text: LcLinkedList.copy_list_with_random_pointer,
  //     link: linkedList(LcLinkedList.copy_list_with_random_pointer)
  //   },
  //   {
  //     text: LcLinkedList.delete_node_in_a_linked_list,
  //     link: linkedList(LcLinkedList.delete_node_in_a_linked_list)
  //   },
  //   {
  //     text: LcLinkedList.linked_list_cycle,
  //     link: linkedList(LcLinkedList.linked_list_cycle)
  //   },
  //   {
  //     text: LcLinkedList.linked_list_cycle_ii,
  //     link: linkedList(LcLinkedList.linked_list_cycle_ii)
  //   },
  //   {
  //     text: LcLinkedList.merge_two_sorted_lists,
  //     link: linkedList(LcLinkedList.merge_two_sorted_lists)
  //   },
  //   {
  //     text: LcLinkedList.middle_of_the_linked_list,
  //     link: linkedList(LcLinkedList.middle_of_the_linked_list)
  //   },
  //   {
  //     text: LcLinkedList.odd_even_linked_list,
  //     link: linkedList(LcLinkedList.odd_even_linked_list)
  //   },
  //   {
  //     text: LcLinkedList.partition_list,
  //     link: linkedList(LcLinkedList.partition_list)
  //   },
  //   {
  //     text: LcLinkedList.remove_duplicates_from_sorted_list,
  //     link: linkedList(LcLinkedList.remove_duplicates_from_sorted_list)
  //   },
  //   {
  //     text: LcLinkedList.remove_duplicates_from_sorted_list_ii,
  //     link: linkedList(LcLinkedList.remove_duplicates_from_sorted_list_ii)
  //   },
  //   {
  //     text: LcLinkedList.reorder_list,
  //     link: linkedList(LcLinkedList.reorder_list)
  //   },
  //   {
  //     text: LcLinkedList.reverse_linked_list,
  //     link: linkedList(LcLinkedList.reverse_linked_list)
  //   },
  //   {
  //     text: LcLinkedList.reverse_linked_list_ii,
  //     link: linkedList(LcLinkedList.reverse_linked_list_ii)
  //   },
  //   {
  //     text: LcLinkedList.reverse_nodes_in_k_group,
  //     link: linkedList(LcLinkedList.reverse_nodes_in_k_group)
  //   },
  //   {
  //     text: LcLinkedList.rotate_list,
  //     link: linkedList(LcLinkedList.rotate_list)
  //   },
  //   {
  //     text: LcLinkedList.sort_list,
  //     link: linkedList(LcLinkedList.sort_list)
  //   },
  //   {
  //     text: LcLinkedList.swap_nodes_in_pairs,
  //     link: linkedList(LcLinkedList.swap_nodes_in_pairs)
  //   }
  // ],
  collapsed: true
}

// =====栈=====
enum LcStack {
  basic_calculator_ii = '基本计算器II',
  daily_temperatures = '每日温度',
  decode_string = '字符串解码',
  evaluate_reverse_polish_notation = '逆波兰表达式求值',
  palindrome_linked_list = '回文链表',
  shortest_unsorted_continuous_subarray = '最短无序连续子数组',
  valid_parentheses = '有效的括号'
}
const stack = (subPath: string) => tsalg('/stack/' + subPath)
const stackSidebar = {
  text: '栈',
  // items: [
  //   {
  //     text: LcStack.basic_calculator_ii,
  //     link: stack(LcStack.basic_calculator_ii)
  //   },
  //   {
  //     text: LcStack.daily_temperatures,
  //     link: stack(LcStack.daily_temperatures)
  //   },
  //   {
  //     text: LcStack.decode_string,
  //     link: stack(LcStack.decode_string)
  //   },
  //   {
  //     text: LcStack.evaluate_reverse_polish_notation,
  //     link: stack(LcStack.evaluate_reverse_polish_notation)
  //   },
  //   {
  //     text: LcStack.palindrome_linked_list,
  //     link: stack(LcStack.palindrome_linked_list)
  //   },
  //   {
  //     text: LcStack.shortest_unsorted_continuous_subarray,
  //     link: stack(LcStack.shortest_unsorted_continuous_subarray)
  //   },
  //   {
  //     text: LcStack.valid_parentheses,
  //     link: stack(LcStack.valid_parentheses)
  //   }
  // ],
  collapsed: true
}

// =====哈希表=====
enum LcHashTable {
  _4_sum_ii = '四数相加II',
  first_unique_character_in_a_string = '字符串中的第一个唯一字符',
  group_anagrams = '字母异位词分组',
  happy_number = '快乐数',
  intersection_of_two_arrays = '两个数组的交集',
  longest_substring_without_repeating_characters = '无重复字符的最长子串',
  missing_number = '丢失的数字',
  roman_to_integer = '罗马数字转整数',
  top_k_frequency_elements = '前K个高频元素',
  unique_morse_code_words = '唯一摩尔斯密码词',
  valid_anagram = '有效的字母异位词',
  valid_sudoku = '有效的数独'
}
const hashTable = (subPath: string) => tsalg('/hash-table/' + subPath)
const hashTableSidebar = {
  text: '哈希表',
  // items: [
  //   {
  //     text: LcHashTable._4_sum_ii,
  //     link: hashTable(LcHashTable._4_sum_ii)
  //   },
  //   {
  //     text: LcHashTable.first_unique_character_in_a_string,
  //     link: hashTable(LcHashTable.first_unique_character_in_a_string)
  //   },
  //   {
  //     text: LcHashTable.group_anagrams,
  //     link: hashTable(LcHashTable.group_anagrams)
  //   },
  //   {
  //     text: LcHashTable.happy_number,
  //     link: hashTable(LcHashTable.happy_number)
  //   },
  //   {
  //     text: LcHashTable.intersection_of_two_arrays,
  //     link: hashTable(LcHashTable.intersection_of_two_arrays)
  //   },
  //   {
  //     text: LcHashTable.longest_substring_without_repeating_characters,
  //     link: hashTable(LcHashTable.longest_substring_without_repeating_characters)
  //   },
  //   {
  //     text: LcHashTable.missing_number,
  //     link: hashTable(LcHashTable.missing_number)
  //   },
  //   {
  //     text: LcHashTable.roman_to_integer,
  //     link: hashTable(LcHashTable.roman_to_integer)
  //   },
  //   {
  //     text: LcHashTable.top_k_frequency_elements,
  //     link: hashTable(LcHashTable.top_k_frequency_elements)
  //   },
  //   {
  //     text: LcHashTable.unique_morse_code_words,
  //     link: hashTable(LcHashTable.unique_morse_code_words)
  //   },
  //   {
  //     text: LcHashTable.valid_anagram,
  //     link: hashTable(LcHashTable.valid_anagram)
  //   },
  //   {
  //     text: LcHashTable.valid_sudoku,
  //     link: hashTable(LcHashTable.valid_sudoku)
  //   }
  // ],
  collapsed: true
}

// =====树=====
enum LcTree {
  balanced_binary_tree = '平衡二叉树',
  binary_tree_inorder_traversal = '二叉树的中序遍历',
  binary_tree_postorder_traversal = '二叉树的后序遍历',
  binary_tree_preorder_traversal = '二叉树的前序遍历',
  binary_tree_right_side_view = '二叉树的右视图',
  binary_tree_zigzag_level_order_traversal = '二叉树的锯齿形层序遍历',
  construct_binary_tree_from_preorder_and_inorder_traversal = '从前序与中序遍历序列构造二叉树',
  convert_sorted_array_to_binary_search_tree = '将有序数组转换为二叉搜索树',
  count_complete_tree_nodes = '完全二叉树的节点个数',
  diameter_of_binary_tree = '二叉树的直径',
  flatten_binary_tree_to_linked_list = '二叉树展开为链表',
  invert_binary_tree = '翻转二叉树',
  kth_smallest_element_in_a_bst = '二叉搜索树中第K小的元素',
  maximum_width_of_binary_tree = '二叉树最大宽度',
  n_ary_tree_level_order_traversal = 'N叉树的层序遍历',
  path_sum = '路径总和',
  path_sum_iii = '路径总和III',
  same_tree = '相同的树',
  sum_root_to_leaf_numbers = '求根节点到叶节点数字之和',
  symmetric_tree = '对称二叉树',
  validate_binary_search_tree = '验证二叉搜索树'
}
const tree = (subPath: string) => tsalg('/tree/' + subPath)
const treeSidebar = {
  text: '树',
  // items: [
  //   {
  //     text: LcTree.balanced_binary_tree,
  //     link: tree(LcTree.balanced_binary_tree)
  //   },
  //   {
  //     text: LcTree.binary_tree_inorder_traversal,
  //     link: tree(LcTree.binary_tree_inorder_traversal)
  //   },
  //   {
  //     text: LcTree.binary_tree_postorder_traversal,
  //     link: tree(LcTree.binary_tree_postorder_traversal)
  //   },
  //   {
  //     text: LcTree.binary_tree_preorder_traversal,
  //     link: tree(LcTree.binary_tree_preorder_traversal)
  //   },
  //   {
  //     text: LcTree.binary_tree_right_side_view,
  //     link: tree(LcTree.binary_tree_right_side_view)
  //   },
  //   {
  //     text: LcTree.binary_tree_zigzag_level_order_traversal,
  //     link: tree(LcTree.binary_tree_zigzag_level_order_traversal)
  //   },
  //   {
  //     text: LcTree.construct_binary_tree_from_preorder_and_inorder_traversal,
  //     link: tree(LcTree.construct_binary_tree_from_preorder_and_inorder_traversal)
  //   },
  //   {
  //     text: LcTree.convert_sorted_array_to_binary_search_tree,
  //     link: tree(LcTree.convert_sorted_array_to_binary_search_tree)
  //   },
  //   {
  //     text: LcTree.count_complete_tree_nodes,
  //     link: tree(LcTree.count_complete_tree_nodes)
  //   },
  //   {
  //     text: LcTree.diameter_of_binary_tree,
  //     link: tree(LcTree.diameter_of_binary_tree)
  //   },
  //   {
  //     text: LcTree.flatten_binary_tree_to_linked_list,
  //     link: tree(LcTree.flatten_binary_tree_to_linked_list)
  //   },
  //   {
  //     text: LcTree.invert_binary_tree,
  //     link: tree(LcTree.invert_binary_tree)
  //   },
  //   {
  //     text: LcTree.kth_smallest_element_in_a_bst,
  //     link: tree(LcTree.kth_smallest_element_in_a_bst)
  //   },
  //   {
  //     text: LcTree.maximum_width_of_binary_tree,
  //     link: tree(LcTree.maximum_width_of_binary_tree)
  //   },
  //   {
  //     text: LcTree.n_ary_tree_level_order_traversal,
  //     link: tree(LcTree.n_ary_tree_level_order_traversal)
  //   },
  //   {
  //     text: LcTree.path_sum,
  //     link: tree(LcTree.path_sum)
  //   },
  //   {
  //     text: LcTree.path_sum_iii,
  //     link: tree(LcTree.path_sum_iii)
  //   },
  //   {
  //     text: LcTree.same_tree,
  //     link: tree(LcTree.same_tree)
  //   },
  //   {
  //     text: LcTree.sum_root_to_leaf_numbers,
  //     link: tree(LcTree.sum_root_to_leaf_numbers)
  //   },
  //   {
  //     text: LcTree.symmetric_tree,
  //     link: tree(LcTree.symmetric_tree)
  //   },
  //   {
  //     text: LcTree.validate_binary_search_tree,
  //     link: tree(LcTree.validate_binary_search_tree)
  //   }
  // ],
  collapsed: true
}

// =====堆=====
enum LcHeap {
  kth_largest_element_in_an_array = '数组中的第K个最大元素',
  kth_smallest_element_in_a_sorted_matrix = '有序矩阵中第K小的元素',
  merge_k_sorted_lists = '合并K个升序链表',
  sort_an_array = '排序数组',
  top_k_frequent_elements = '前K个高频元素'
}
const heap = (subPath: string) => tsalg('/heap/' + subPath)
const heapSidebar = {
  text: '堆',
  // items: [
  //   {
  //     text: LcHeap.kth_largest_element_in_an_array,
  //     link: heap(LcHeap.kth_largest_element_in_an_array)
  //   },
  //   {
  //     text: LcHeap.kth_smallest_element_in_a_sorted_matrix,
  //     link: heap(LcHeap.kth_smallest_element_in_a_sorted_matrix)
  //   },
  //   {
  //     text: LcHeap.merge_k_sorted_lists,
  //     link: heap(LcHeap.merge_k_sorted_lists)
  //   },
  //   {
  //     text: LcHeap.sort_an_array,
  //     link: heap(LcHeap.sort_an_array)
  //   },
  //   {
  //     text: LcHeap.top_k_frequent_elements,
  //     link: heap(LcHeap.top_k_frequent_elements)
  //   }
  // ],
  collapsed: true
}

// =====字符串=====
enum LcString {
  count_and_say = '外观数列',
  excel_sheet_column_number = 'Excel表列序号',
  largest_number = '最大数',
  longest_common_prefix = '最长公共前缀',
  number_of_1_bits = '位1的个数',
  reverse_words_in_a_string = '反转字符串中的单词',
  string_to_integer_atoi = '字符串转换整数(atoi)'
}
const string = (subPath: string) => tsalg('/string/' + subPath)
const stringSidebar = {
  text: '字符串',
  // items: [
  //   {
  //     text: LcString.count_and_say,
  //     link: string(LcString.count_and_say)
  //   },
  //   {
  //     text: LcString.excel_sheet_column_number,
  //     link: string(LcString.excel_sheet_column_number)
  //   },
  //   {
  //     text: LcString.largest_number,
  //     link: string(LcString.largest_number)
  //   },
  //   {
  //     text: LcString.longest_common_prefix,
  //     link: string(LcString.longest_common_prefix)
  //   },
  //   {
  //     text: LcString.number_of_1_bits,
  //     link: string(LcString.number_of_1_bits)
  //   },
  //   {
  //     text: LcString.reverse_words_in_a_string,
  //     link: string(LcString.reverse_words_in_a_string)
  //   },
  //   {
  //     text: LcString.string_to_integer_atoi,
  //     link: string(LcString.string_to_integer_atoi)
  //   }
  // ],
  collapsed: true
}

// =====图=====
enum LcGraph {
  course_schedule = '课程表',
  course_schedule_ii = '课程表II',
  max_area_of_island = '岛屿的最大面积'
}
const graph = (subPath: string) => tsalg('/graph/' + subPath)
const graphSidebar = {
  text: '图',
  // items: [
  //   {
  //     text: LcGraph.course_schedule,
  //     link: graph(LcGraph.course_schedule)
  //   },
  //   {
  //     text: LcGraph.course_schedule_ii,
  //     link: graph(LcGraph.course_schedule_ii)
  //   },
  //   {
  //     text: LcGraph.max_area_of_island,
  //     link: graph(LcGraph.max_area_of_island)
  //   }
  // ],
  collapsed: true
}

// =====并查集=====
enum LcUnionFind {
  longest_consecutive_sequence = '最长连续序列',
  number_of_islands = '岛屿数量',
  number_of_provinces = '省份数量',
  surrounded_regions = '被围绕的区域'
}
const unionFind = (subPath: string) => tsalg('/union-find/' + subPath)
const unionFindSidebar = {
  text: '并查集',
  // items: [
  //   {
  //     text: LcUnionFind.longest_consecutive_sequence,
  //     link: unionFind(LcUnionFind.longest_consecutive_sequence)
  //   },
  //   {
  //     text: LcUnionFind.number_of_islands,
  //     link: unionFind(LcUnionFind.number_of_islands)
  //   },
  //   {
  //     text: LcUnionFind.number_of_provinces,
  //     link: unionFind(LcUnionFind.number_of_provinces)
  //   },
  //   {
  //     text: LcUnionFind.surrounded_regions,
  //     link: unionFind(LcUnionFind.surrounded_regions)
  //   }
  // ],
  collapsed: true
}

// ====================================算法=====================================

// =====二分搜索=====
enum LcBinarySearch {
  search_in_rotated_sorted_array = '搜索旋转排序数组',
  find_first_and_last_position_of_element_in_sorted_array = '在排序数组中查找元素的第一个和最后一个位置',
  sqrt_x = 'x的平方根',
  find_peak_element = '寻找峰值',
  search_a_2_d_matrix_ii = '搜索二维矩阵II',
  binary_search = '二分查找'
}
const binarySearch = (subPath: string) => tsalg('/binary-search/' + subPath)
const binarySearchSidebar = {
  text: '二分搜索',
  // items: [
  //   {
  //     text: LcBinarySearch.search_in_rotated_sorted_array,
  //     link: binarySearch(LcBinarySearch.search_in_rotated_sorted_array)
  //   },
  //   {
  //     text: LcBinarySearch.find_first_and_last_position_of_element_in_sorted_array,
  //     link: binarySearch(LcBinarySearch.find_first_and_last_position_of_element_in_sorted_array)
  //   },
  //   {
  //     text: LcBinarySearch.sqrt_x,
  //     link: binarySearch(LcBinarySearch.sqrt_x)
  //   },
  //   {
  //     text: LcBinarySearch.find_peak_element,
  //     link: binarySearch(LcBinarySearch.find_peak_element)
  //   },
  //   {
  //     text: LcBinarySearch.search_a_2_d_matrix_ii,
  //     link: binarySearch(LcBinarySearch.search_a_2_d_matrix_ii)
  //   },
  //   {
  //     text: LcBinarySearch.binary_search,
  //     link: binarySearch(LcBinarySearch.binary_search)
  //   }
  // ],
  collapsed: true
}

// =====回溯算法=====
enum LcBacktracking {
  letter_combinations_of_a_phone_number = '电话号码的字母组合',
  combination_sum = '组合总和',
  combination_sum_ii = '组合总和II',
  permutations = '全排列',
  permutations_ii = '全排列II',
  combinations = '组合',
  subsets = '子集',
  word_search = '单词搜索',
  subsets_ii = '子集II',
  restore_ip_addresses = '复原IP地址',
  palindrome_partitioning = '分割回文串',
  target_sum = '目标和'
}
const backtracking = (subPath: string) => tsalg('/backtracking/' + subPath)
const backtrackingSidebar = {
  text: '回溯算法',
  // items: [
  //   {
  //     text: LcBacktracking.letter_combinations_of_a_phone_number,
  //     link: backtracking(LcBacktracking.letter_combinations_of_a_phone_number)
  //   },
  //   {
  //     text: LcBacktracking.combination_sum,
  //     link: backtracking(LcBacktracking.combination_sum)
  //   },
  //   {
  //     text: LcBacktracking.combination_sum_ii,
  //     link: backtracking(LcBacktracking.combination_sum_ii)
  //   },
  //   {
  //     text: LcBacktracking.permutations,
  //     link: backtracking(LcBacktracking.permutations)
  //   },
  //   {
  //     text: LcBacktracking.permutations_ii,
  //     link: backtracking(LcBacktracking.permutations_ii)
  //   },
  //   {
  //     text: LcBacktracking.combinations,
  //     link: backtracking(LcBacktracking.combinations)
  //   },
  //   {
  //     text: LcBacktracking.subsets,
  //     link: backtracking(LcBacktracking.subsets)
  //   },
  //   {
  //     text: LcBacktracking.word_search,
  //     link: backtracking(LcBacktracking.word_search)
  //   },
  //   {
  //     text: LcBacktracking.subsets_ii,
  //     link: backtracking(LcBacktracking.subsets_ii)
  //   },
  //   {
  //     text: LcBacktracking.restore_ip_addresses,
  //     link: backtracking(LcBacktracking.restore_ip_addresses)
  //   },
  //   {
  //     text: LcBacktracking.palindrome_partitioning,
  //     link: backtracking(LcBacktracking.palindrome_partitioning)
  //   },
  //   {
  //     text: LcBacktracking.target_sum,
  //     link: backtracking(LcBacktracking.target_sum)
  //   }
  // ] ,
  collapsed: true
}

// =====动态规划=====
enum LcDynamicProgramming {
  best_time_to_buy_and_sell_stock = '买卖股票的最佳时机',
  best_time_to_buy_and_sell_stock_ii = '买卖股票的最佳时机II',
  climbing_stairs = '爬楼梯',
  coin_change = '零钱兑换',
  counting_bits = '比特位计数',
  decode_ways = '解码方法',
  jump_game = '跳跃游戏',
  longest_common_subsequence = '最长公共子序列',
  longest_continuous_increasing_subsequence = '最长连续递增序列',
  longest_increasing_subsequence = '最长递增子序列',
  longest_palindromic_substring = '最长回文子串',
  maximum_subarray = '最大子数组和',
  minimum_path_sum = '最小路径和',
  palindromic_substrings = '回文子串',
  partition_equal_subset_sum = '分割等和子集',
  pascals_triangle = '杨辉三角',
  unique_binary_search_trees = '不同的二叉搜索树',
  unique_paths = '不同路径',
  unique_paths_ii = '不同路径II',
  word_break = '单词拆分'
}
const dynamicProgramming = (subPath: string) => tsalg('/dynamic-programming/' + subPath)
const dynamicProgrammingSidebar = {
  text: '动态规划',
  // items: [
  //   {
  //     text: LcDynamicProgramming.best_time_to_buy_and_sell_stock,
  //     link: dynamicProgramming(LcDynamicProgramming.best_time_to_buy_and_sell_stock)
  //   },
  //   {
  //     text: LcDynamicProgramming.best_time_to_buy_and_sell_stock_ii,
  //     link: dynamicProgramming(LcDynamicProgramming.best_time_to_buy_and_sell_stock_ii)
  //   },
  //   {
  //     text: LcDynamicProgramming.climbing_stairs,
  //     link: dynamicProgramming(LcDynamicProgramming.climbing_stairs)
  //   },
  //   {
  //     text: LcDynamicProgramming.coin_change,
  //     link: dynamicProgramming(LcDynamicProgramming.coin_change)
  //   },
  //   {
  //     text: LcDynamicProgramming.counting_bits,
  //     link: dynamicProgramming(LcDynamicProgramming.counting_bits)
  //   },
  //   {
  //     text: LcDynamicProgramming.decode_ways,
  //     link: dynamicProgramming(LcDynamicProgramming.decode_ways)
  //   },
  //   {
  //     text: LcDynamicProgramming.jump_game,
  //     link: dynamicProgramming(LcDynamicProgramming.jump_game)
  //   },
  //   {
  //     text: LcDynamicProgramming.longest_common_subsequence,
  //     link: dynamicProgramming(LcDynamicProgramming.longest_common_subsequence)
  //   },
  //   {
  //     text: LcDynamicProgramming.longest_continuous_increasing_subsequence,
  //     link: dynamicProgramming(LcDynamicProgramming.longest_continuous_increasing_subsequence)
  //   },
  //   {
  //     text: LcDynamicProgramming.longest_increasing_subsequence,
  //     link: dynamicProgramming(LcDynamicProgramming.longest_increasing_subsequence)
  //   },
  //   {
  //     text: LcDynamicProgramming.longest_palindromic_substring,
  //     link: dynamicProgramming(LcDynamicProgramming.longest_palindromic_substring)
  //   },
  //   {
  //     text: LcDynamicProgramming.maximum_subarray,
  //     link: dynamicProgramming(LcDynamicProgramming.maximum_subarray)
  //   },
  //   {
  //     text: LcDynamicProgramming.minimum_path_sum,
  //     link: dynamicProgramming(LcDynamicProgramming.minimum_path_sum)
  //   },
  //   {
  //     text: LcDynamicProgramming.palindromic_substrings,
  //     link: dynamicProgramming(LcDynamicProgramming.palindromic_substrings)
  //   },
  //   {
  //     text: LcDynamicProgramming.partition_equal_subset_sum,
  //     link: dynamicProgramming(LcDynamicProgramming.partition_equal_subset_sum)
  //   },
  //   {
  //     text: LcDynamicProgramming.pascals_triangle,
  //     link: dynamicProgramming(LcDynamicProgramming.pascals_triangle)
  //   },
  //   {
  //     text: LcDynamicProgramming.unique_binary_search_trees,
  //     link: dynamicProgramming(LcDynamicProgramming.unique_binary_search_trees)
  //   },
  //   {
  //     text: LcDynamicProgramming.unique_paths,
  //     link: dynamicProgramming(LcDynamicProgramming.unique_paths)
  //   },
  //   {
  //     text: LcDynamicProgramming.unique_paths_ii,
  //     link: dynamicProgramming(LcDynamicProgramming.unique_paths_ii)
  //   },
  //   {
  //     text: LcDynamicProgramming.word_break,
  //     link: dynamicProgramming(LcDynamicProgramming.word_break)
  //   }
  // ],
  collapsed: true
}

// =====贪心算法=====
enum LcGreedy { }
const greedy = (subPath: string) => tsalg('/greedy/' + subPath)
const greedySidebar = {
  text: '贪心算法',
  // items: [
  //   {
  //     text: '聊聊插件化系统设计',
  //     link: greedy('聊聊插件化系统设计')
  //   },
  // ],
  collapsed: true
}
// ====================================技巧=====================================

// =====双指针=====
enum LcTwoPointers {
  _3_sum = '三数之和',
  _3_sum_closest = '最接近的三数之和',
  _4_sum = '四数之和',
  add_strings = '字符串相加',
  compare_version_numbers = '比较版本号',
  find_the_duplicate_number = '寻找重复数',
  maximum_average_subarray_i = '子数组最大平均数I',
  merge_sorted_array = '合并两个有序数组',
  sort_colors = '颜色分类',
  two_sum = '两数之和'
}
const twoPointers = (subPath: string) => tsalg('/two-pointers/' + subPath)
const twoPointersSidebar = {
  text: '双指针',
  // items: [
  //   {
  //     text: LcTwoPointers._3_sum,
  //     link: twoPointers(LcTwoPointers._3_sum)
  //   },
  //   {
  //     text: LcTwoPointers._3_sum_closest,
  //     link: twoPointers(LcTwoPointers._3_sum_closest)
  //   },
  //   {
  //     text: LcTwoPointers._4_sum,
  //     link: twoPointers(LcTwoPointers._4_sum)
  //   },
  //   {
  //     text: LcTwoPointers.add_strings,
  //     link: twoPointers(LcTwoPointers.add_strings)
  //   },
  //   {
  //     text: LcTwoPointers.compare_version_numbers,
  //     link: twoPointers(LcTwoPointers.compare_version_numbers)
  //   },
  //   {
  //     text: LcTwoPointers.find_the_duplicate_number,
  //     link: twoPointers(LcTwoPointers.find_the_duplicate_number)
  //   },
  //   {
  //     text: LcTwoPointers.maximum_average_subarray_i,
  //     link: twoPointers(LcTwoPointers.maximum_average_subarray_i)
  //   },
  //   {
  //     text: LcTwoPointers.merge_sorted_array,
  //     link: twoPointers(LcTwoPointers.merge_sorted_array)
  //   },
  //   {
  //     text: LcTwoPointers.sort_colors,
  //     link: twoPointers(LcTwoPointers.sort_colors)
  //   },
  //   {
  //     text: LcTwoPointers.two_sum,
  //     link: twoPointers(LcTwoPointers.two_sum)
  //   }
  // ],
  collapsed: true
}

// =====滑动窗口=====
enum LcSlidingWindow {
  find_all_anagrams_in_a_string = '找到字符串中所有字母异位词',
  longest_substring_without_repeating_characters = '无重复字符的最长子串',
  minimum_size_subarray_sum = '长度最小的子数组',
  minimum_window_substring = '最小覆盖子串',
  sliding_window_maximum = '滑动窗口最大值'
}
const slidingWindow = (subPath: string) => tsalg('/sliding-window/' + subPath)
const slidingWindowSidebar = {
  text: '滑动窗口',
  // items: [
  //   {
  //     text: LcSlidingWindow.find_all_anagrams_in_a_string,
  //     link: slidingWindow(LcSlidingWindow.find_all_anagrams_in_a_string)
  //   },
  //   {
  //     text: LcSlidingWindow.longest_substring_without_repeating_characters,
  //     link: slidingWindow(LcSlidingWindow.longest_substring_without_repeating_characters)
  //   },
  //   {
  //     text: LcSlidingWindow.minimum_size_subarray_sum,
  //     link: slidingWindow(LcSlidingWindow.minimum_size_subarray_sum)
  //   },
  //   {
  //     text: LcSlidingWindow.minimum_window_substring,
  //     link: slidingWindow(LcSlidingWindow.minimum_window_substring)
  //   },
  //   {
  //     text: LcSlidingWindow.sliding_window_maximum,
  //     link: slidingWindow(LcSlidingWindow.sliding_window_maximum)
  //   }
  // ],
  collapsed: true
}

// =====前缀和=====
enum LcPrefixuSum {
  range_sum_query_immutable = '区域和检索-数组不可变',
  range_sum_query_2_d_immutable = '二维区域和检索-矩阵不可变',
  subarray_sum_equals_k = '和为K的子数组',
  running_sum_of_1_d_array = '一维数组的动态和',
  sum_of_all_odd_length_subarrays = '所有奇数长度子数组的和'
}
const prefixSum = (subPath: string) => tsalg('/prefix-sum/' + subPath)
const prefixSumSidebar = {
  text: '前缀和',
  // items: [
  //   {
  //     text: LcPrefixuSum.range_sum_query_immutable,
  //     link: prefixSum(LcPrefixuSum.range_sum_query_immutable)
  //   },
  //   {
  //     text: LcPrefixuSum.range_sum_query_2_d_immutable,
  //     link: prefixSum(LcPrefixuSum.range_sum_query_2_d_immutable)
  //   },
  //   {
  //     text: LcPrefixuSum.subarray_sum_equals_k,
  //     link: prefixSum(LcPrefixuSum.subarray_sum_equals_k)
  //   },
  //   {
  //     text: LcPrefixuSum.running_sum_of_1_d_array,
  //     link: prefixSum(LcPrefixuSum.running_sum_of_1_d_array)
  //   },
  //   {
  //     text: LcPrefixuSum.sum_of_all_odd_length_subarrays,
  //     link: prefixSum(LcPrefixuSum.sum_of_all_odd_length_subarrays)
  //   }
  // ],
  collapsed: true
}

// ====================================其他=====================================

// =====设计=====
enum LcDesign {
  binary_search_tree_iterator = '二叉搜索树迭代器',
  design_add_and_search_words_data_structure = '添加与搜索单词-数据结构设计',
  design_circular_queue = '设计循环队列',
  design_linked_list = '设计链表',
  flatten_nested_list_iterator = '扁平化嵌套列表迭代器',
  implement_trie_prefix_tree = '实现Trie(前缀树)',
  insert_delete_get_random_o_1 = 'O(1)时间插入、删除和获取随机元素',
  kth_largest_element_in_a_stream = '数据流中的第K大元素',
  lru_cache = 'LRU缓存',
  serialize_and_deserialize_binary_tree = '二叉树的序列化与反序列化',
  shuffle_an_array = '打乱数组'
}
const design = (subPath: string) => tsalg('/design/' + subPath)
const designSidebar = {
  text: '设计',
  // items: [
  //   {
  //     text: LcDesign.binary_search_tree_iterator,
  //     link: design(LcDesign.binary_search_tree_iterator)
  //   },
  //   {
  //     text: LcDesign.design_add_and_search_words_data_structure,
  //     link: design(LcDesign.design_add_and_search_words_data_structure)
  //   },
  //   {
  //     text: LcDesign.design_circular_queue,
  //     link: design(LcDesign.design_circular_queue)
  //   },
  //   {
  //     text: LcDesign.design_linked_list,
  //     link: design(LcDesign.design_linked_list)
  //   },
  //   {
  //     text: LcDesign.flatten_nested_list_iterator,
  //     link: design(LcDesign.flatten_nested_list_iterator)
  //   },
  //   {
  //     text: LcDesign.implement_trie_prefix_tree,
  //     link: design(LcDesign.implement_trie_prefix_tree)
  //   },
  //   {
  //     text: LcDesign.insert_delete_get_random_o_1,
  //     link: design(LcDesign.insert_delete_get_random_o_1)
  //   },
  //   {
  //     text: LcDesign.kth_largest_element_in_a_stream,
  //     link: design(LcDesign.kth_largest_element_in_a_stream)
  //   },
  //   {
  //     text: LcDesign.lru_cache,
  //     link: design(LcDesign.lru_cache)
  //   },
  //   {
  //     text: LcDesign.serialize_and_deserialize_binary_tree,
  //     link: design(LcDesign.serialize_and_deserialize_binary_tree)
  //   },
  //   {
  //     text: LcDesign.shuffle_an_array,
  //     link: design(LcDesign.shuffle_an_array)
  //   }
  // ],
  collapsed: true
}

// =====数学=====
enum LcMath {
  pow_x_n = 'Pow(x, n)',
  factorial_trailing_zeroes = '阶乘后的零',
  power_of_three = '3的幂',
  fizz_buzz = 'FizzBuzz'
}
const math = (subPath: string) => tsalg('/math/' + subPath)
const mathSidebar = {
  text: '数学',
  // items: [
  //   {
  //     text: LcMath.pow_x_n,
  //     link: math(LcMath.pow_x_n)
  //   },
  //   {
  //     text: LcMath.factorial_trailing_zeroes,
  //     link: math(LcMath.factorial_trailing_zeroes)
  //   },
  //   {
  //     text: LcMath.power_of_three,
  //     link: math(LcMath.power_of_three)
  //   },
  //   {
  //     text: LcMath.fizz_buzz,
  //     link: math(LcMath.fizz_buzz)
  //   }
  // ],
  collapsed: true
}

// =====位操作=====
enum LcBitManipulation {
  divide_two_integers = '两数相除',
  reverse_bits = '颠倒二进制位',
  single_number_iii = '只出现一次的数字III',
  sum_of_two_integers = '两整数之和'
}
const bitManipulation = (subPath: string) => tsalg('/bit-manipulation/' + subPath)
const bitManipulationSidebar = {
  text: '位操作',
  // items: [
  //   {
  //     text: LcBitManipulation.divide_two_integers,
  //     link: bitManipulation(LcBitManipulation.divide_two_integers)
  //   },
  //   {
  //     text: LcBitManipulation.reverse_bits,
  //     link: bitManipulation(LcBitManipulation.reverse_bits)
  //   },
  //   {
  //     text: LcBitManipulation.single_number_iii,
  //     link: bitManipulation(LcBitManipulation.single_number_iii)
  //   },
  //   {
  //     text: LcBitManipulation.sum_of_two_integers,
  //     link: bitManipulation(LcBitManipulation.sum_of_two_integers)
  //   }
  // ],
  collapsed: true
}


const nav = { text: 'tsalg', link: array(LcArray.next_permutation) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [tsalg('/')]: [
    // 数据结构
    arraySidebar,
    linkedListSidebar,
    stackSidebar,
    hashTableSidebar,
    treeSidebar,
    heapSidebar,
    stringSidebar,
    graphSidebar,
    unionFindSidebar,
    // 算法
    binarySearchSidebar,
    backtrackingSidebar,
    dynamicProgrammingSidebar,
    // greedySidebar,
    // 技巧
    twoPointersSidebar,
    slidingWindowSidebar,
    prefixSumSidebar,
    // 其他
    designSidebar,
    mathSidebar,
    bitManipulationSidebar
  ]
}

export default {
  nav,
  sidebar
}
