# from flask import Flask, request, jsonify
# import numpy as np
# import pandas as pd
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity

# app = Flask(__name__)

# # Đọc dữ liệu và khởi tạo TF-IDF Vectorizer
# df = pd.read_csv('C:/Users/HP/Desktop/C2SE14_SmartFood_Advisor/ai/smartfood.products.csv')
# df2 = pd.read_csv('C:/Users/HP/Desktop/C2SE14_SmartFood_Advisor/ai/disease_nutrition_suggestions.csv')

# # vectorizer_disease = TfidfVectorizer(stop_words='english')
# # vectorizer_description = TfidfVectorizer(stop_words='english')

# # tfidf_matrix_disease = vectorizer_disease.fit_transform(df2['Conditions'].values.astype('U'))
# # tfidf_matrix_description = vectorizer_description.fit_transform(df['nutrition'].values.astype('U'))

# # # API để tính BMI và gợi ý dinh dưỡng
# # @app.route('/api/health', methods=['POST'])
# # def health_recommendations():
# #     data = request.get_json()
# #     age = data.get('age')
# #     height = data.get('height')
# #     weight = data.get('weight')
# #     disease_input = data.get('disease')

# #     # Tính BMI
# #     height_m = height / 100  # Chuyển từ cm sang m
# #     bmi = weight / (height_m ** 2)

# #     # Điều chỉnh đầu vào bệnh theo BMI
# #     if bmi < 18.5:
# #         disease_input = "malnutrition " + disease_input
# #     elif bmi > 25:
# #         disease_input = "overweight " + disease_input

# #     # Gợi ý dinh dưỡng dựa trên bệnh
# #     input_vector = vectorizer_disease.transform([disease_input])
# #     similarities_disease = cosine_similarity(input_vector, tfidf_matrix_disease)
# #     top_index_disease = similarities_disease.argsort()[0][-1]
# #     condition_recommendation = df2.iloc[top_index_disease]['Conditions']
# #     nutrition_recommendation = df2.iloc[top_index_disease]['Nutritional Suggestions']

# #     # Gợi ý sản phẩm dựa trên dinh dưỡng
# #     input_vector_description = vectorizer_description.transform([nutrition_recommendation])
# #     similarities = cosine_similarity(input_vector_description, tfidf_matrix_description)
# #     top_index_product = similarities.argsort()[0][-5:][::-1]
# #     recommended_products = df.iloc[top_index_product]

# #     # Trả về kết quả gợi ý
# #     response = {
# #         'bmi': bmi,
# #         'condition': condition_recommendation,
# #         'nutrition_recommendation': nutrition_recommendation,
# #         'recommended_products': recommended_products[['name', 'nutrition', 'description']].to_dict(orient='records')
# #     }

# #     return jsonify(response)

# if __name__ == '__main__':
#     app.run(debug=True)
